import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserStats {
  xp: number;
  maxXp: number;
  streak: number;
  wordsLearned: number;
  phonemesLearned: number;
  sentencesLearned: number;
  accuracy: number;
  currentLevel: number;
}

interface TodaysPractice {
  completed: number;
  target: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
}

export const useUserProgress = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 0,
    maxXp: 1000,
    streak: 0,
    wordsLearned: 0,
    phonemesLearned: 0,
    sentencesLearned: 0,
    accuracy: 0,
    currentLevel: 1,
  });
  const [todaysPractice, setTodaysPractice] = useState<TodaysPractice>({
    completed: 0,
    target: 10,
  });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user?.id) return;

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('current_level, total_xp, streak_days, last_active_date')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setUserStats(prev => ({
          ...prev,
          currentLevel: profile.current_level || 1,
          xp: profile.total_xp || 0,
          maxXp: (profile.current_level || 1) * 1000,
          streak: profile.streak_days || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserProgress = async () => {
    if (!user?.id) return;

    try {
      // Fetch overall progress stats
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('exercise_type, score, accuracy')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      if (progressData) {
        const phonemes = progressData.filter(p => p.exercise_type === 'phoneme').length;
        const words = progressData.filter(p => p.exercise_type === 'word').length;
        const sentences = progressData.filter(p => p.exercise_type === 'sentence').length;
        const totalAccuracy = progressData.length > 0 
          ? Math.round(progressData.reduce((sum, p) => sum + p.accuracy, 0) / progressData.length)
          : 0;

        setUserStats(prev => ({
          ...prev,
          phonemesLearned: phonemes,
          wordsLearned: words,
          sentencesLearned: sentences,
          accuracy: totalAccuracy,
        }));
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const fetchTodaysActivity = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: activity, error } = await supabase
        .from('daily_activities')
        .select('exercises_completed, phonemes_practiced, words_practiced, sentences_practiced')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (activity) {
        setTodaysPractice({
          completed: activity.exercises_completed || 0,
          target: 10, // Default target
        });
      }
    } catch (error) {
      console.error('Error fetching today\'s activity:', error);
    }
  };

  const fetchUserBadges = async () => {
    if (!user?.id) return;

    try {
      // Fetch all badges and user's earned badges
      const [{ data: allBadges }, { data: userBadges }] = await Promise.all([
        supabase.from('badges').select('*').eq('is_active', true),
        supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', user.id)
      ]);

      if (allBadges) {
        const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
        const badgesList = allBadges.map(badge => ({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          earned: earnedBadgeIds.has(badge.id),
          earnedAt: userBadges?.find(ub => ub.badge_id === badge.id)?.earned_at,
        }));
        setBadges(badgesList.slice(0, 4)); // Show only first 4 badges
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
    }
  };

  const updateStreak = async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user practiced yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const { data: profile } = await supabase
        .from('profiles')
        .select('last_active_date, streak_days')
        .eq('user_id', user.id)
        .single();

      let newStreak = 1;
      if (profile?.last_active_date) {
        if (profile.last_active_date === yesterdayStr) {
          newStreak = (profile.streak_days || 0) + 1;
        } else if (profile.last_active_date === today) {
          newStreak = profile.streak_days || 1;
        }
      }

      await supabase
        .from('profiles')
        .update({ 
          last_active_date: today,
          streak_days: newStreak 
        })
        .eq('user_id', user.id);

      setUserStats(prev => ({ ...prev, streak: newStreak }));
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const recordExerciseCompletion = async (
    exerciseType: string,
    score: number,
    accuracy: number,
    exerciseId?: string,
    assignmentId?: string
  ) => {
    if (!user?.id) return;

    try {
      const xpEarned = Math.round(score * (accuracy / 100));
      
      // Record progress
      await supabase.from('user_progress').insert({
        user_id: user.id,
        exercise_id: exerciseId,
        assignment_id: assignmentId,
        exercise_type: exerciseType,
        score,
        accuracy,
        xp_earned: xpEarned,
      });

      // Update daily activities
      const today = new Date().toISOString().split('T')[0];
      const { data: existingActivity } = await supabase
        .from('daily_activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('activity_date', today)
        .single();

      const updateData = {
        exercises_completed: (existingActivity?.exercises_completed || 0) + 1,
        total_xp_earned: (existingActivity?.total_xp_earned || 0) + xpEarned,
        ...(exerciseType === 'phoneme' && {
          phonemes_practiced: (existingActivity?.phonemes_practiced || 0) + 1
        }),
        ...(exerciseType === 'word' && {
          words_practiced: (existingActivity?.words_practiced || 0) + 1
        }),
        ...(exerciseType === 'sentence' && {
          sentences_practiced: (existingActivity?.sentences_practiced || 0) + 1
        }),
      };

      if (existingActivity) {
        await supabase
          .from('daily_activities')
          .update(updateData)
          .eq('id', existingActivity.id);
      } else {
        await supabase
          .from('daily_activities')
          .insert({
            user_id: user.id,
            activity_date: today,
            ...updateData,
          });
      }

      // Update user profile XP and level
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, current_level')
        .eq('user_id', user.id)
        .single();

      const newTotalXp = (profile?.total_xp || 0) + xpEarned;
      const newLevel = Math.floor(newTotalXp / 1000) + 1;
      
      await supabase
        .from('profiles')
        .update({ 
          total_xp: newTotalXp,
          current_level: newLevel
        })
        .eq('user_id', user.id);

      // Update streak
      await updateStreak();

      // Refresh data
      await Promise.all([
        fetchUserProfile(),
        fetchUserProgress(),
        fetchTodaysActivity(),
      ]);

    } catch (error) {
      console.error('Error recording exercise completion:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      Promise.all([
        fetchUserProfile(),
        fetchUserProgress(),
        fetchTodaysActivity(),
        fetchUserBadges(),
      ]).finally(() => setLoading(false));
    }
  }, [user?.id]);

  return {
    userStats,
    todaysPractice,
    badges,
    loading,
    recordExerciseCompletion,
    refreshProgress: () => Promise.all([
      fetchUserProfile(),
      fetchUserProgress(),
      fetchTodaysActivity(),
      fetchUserBadges(),
    ]),
  };
};