import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ExerciseItemProgress {
  item_index: number;
  item_content: string;
  last_score: number;
  best_score: number;
  attempts: number;
}

interface ExerciseProgress {
  exercise_id: string;
  level_id: number;
  items: ExerciseItemProgress[];
  overall_best_score: number;
  overall_last_score: number;
  completion_percentage: number;
}

interface LevelProgress {
  level_id: number;
  total_exercises: number;
  completed_exercises: number;
  average_score: number;
  pass_score: number;
  is_completed: boolean;
  completion_percentage: number;
}

export const useDetailedProgress = () => {
  const { user } = useAuth();
  const [levelProgress, setLevelProgress] = useState<Record<number, LevelProgress>>({});
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, ExerciseProgress>>({});
  const [levelConfigs, setLevelConfigs] = useState<Record<number, { pass_score: number }>>({});
  const [loading, setLoading] = useState(true);

  const fetchLevelConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('level_config')
        .select('level_id, pass_score');

      if (error) throw error;

      const configs = data?.reduce((acc, config) => {
        acc[config.level_id] = { pass_score: config.pass_score };
        return acc;
      }, {} as Record<number, { pass_score: number }>) || {};

      setLevelConfigs(configs);
    } catch (error) {
      console.error('Error fetching level configs:', error);
    }
  };

  const fetchLevelProgress = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('level_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const progress = data?.reduce((acc, level) => {
        acc[level.level_id] = {
          level_id: level.level_id,
          total_exercises: level.total_exercises,
          completed_exercises: level.completed_exercises,
          average_score: parseFloat(level.average_score.toString()),
          pass_score: level.pass_score,
          is_completed: level.is_completed,
          completion_percentage: level.total_exercises > 0 
            ? Math.round((level.completed_exercises / level.total_exercises) * 100) 
            : 0,
        };
        return acc;
      }, {} as Record<number, LevelProgress>) || {};

      setLevelProgress(progress);
    } catch (error) {
      console.error('Error fetching level progress:', error);
    }
  };

  const fetchExerciseProgress = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('exercise_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('item_index');

      if (error) throw error;

      const exerciseMap = data?.reduce((acc, item) => {
        const key = item.exercise_id;
        
        if (!acc[key]) {
          acc[key] = {
            exercise_id: item.exercise_id,
            level_id: item.level_id,
            items: [],
            overall_best_score: 0,
            overall_last_score: 0,
            completion_percentage: 0,
          };
        }

        acc[key].items.push({
          item_index: item.item_index,
          item_content: item.item_content,
          last_score: item.last_score,
          best_score: item.best_score,
          attempts: item.attempts,
        });

        return acc;
      }, {} as Record<string, ExerciseProgress>) || {};

      // Calculate overall scores and completion percentage for each exercise
      Object.keys(exerciseMap).forEach(exerciseId => {
        const exercise = exerciseMap[exerciseId];
        const items = exercise.items;
        
        if (items.length > 0) {
          exercise.overall_best_score = Math.round(
            items.reduce((sum, item) => sum + item.best_score, 0) / items.length
          );
          exercise.overall_last_score = Math.round(
            items.reduce((sum, item) => sum + item.last_score, 0) / items.length
          );
          
          const completedItems = items.filter(item => item.attempts > 0).length;
          exercise.completion_percentage = Math.round((completedItems / items.length) * 100);
        }
      });

      setExerciseProgress(exerciseMap);
    } catch (error) {
      console.error('Error fetching exercise progress:', error);
    }
  };

  const recordItemProgress = async (
    exerciseId: string,
    levelId: number,
    itemIndex: number,
    itemContent: string,
    score: number
  ) => {
    if (!user?.id) return;

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('exercise_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .eq('item_index', itemIndex)
        .single();

      if (existing) {
        // Update existing record
        const newBestScore = Math.max(existing.best_score, score);
        await supabase
          .from('exercise_progress')
          .update({
            last_score: score,
            best_score: newBestScore,
            attempts: existing.attempts + 1,
          })
          .eq('id', existing.id);
      } else {
        // Create new record
        await supabase
          .from('exercise_progress')
          .insert({
            user_id: user.id,
            exercise_id: exerciseId,
            level_id: levelId,
            item_index: itemIndex,
            item_content: itemContent,
            last_score: score,
            best_score: score,
            attempts: 1,
          });
      }

      // Refresh data
      await fetchExerciseProgress();
    } catch (error) {
      console.error('Error recording item progress:', error);
    }
  };

  const updateLevelProgress = async (
    levelId: number,
    totalExercises: number,
    completedExercises: number,
    averageScore: number
  ) => {
    if (!user?.id) return;

    try {
      const passScore = levelConfigs[levelId]?.pass_score || 80;
      const isCompleted = averageScore >= passScore && completedExercises === totalExercises;

      const { data: existing } = await supabase
        .from('level_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('level_id', levelId)
        .single();

      const progressData = {
        user_id: user.id,
        level_id: levelId,
        total_exercises: totalExercises,
        completed_exercises: completedExercises,
        average_score: averageScore,
        pass_score: passScore,
        is_completed: isCompleted,
      };

      if (existing) {
        await supabase
          .from('level_progress')
          .update(progressData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('level_progress')
          .insert(progressData);
      }

      // Refresh data
      await fetchLevelProgress();
    } catch (error) {
      console.error('Error updating level progress:', error);
    }
  };

  const updateLevelPassScore = async (levelId: number, passScore: number) => {
    try {
      await supabase
        .from('level_config')
        .upsert({
          level_id: levelId,
          pass_score: passScore,
        });

      // Update all user progress records for this level
      await supabase
        .from('level_progress')
        .update({ pass_score: passScore })
        .eq('level_id', levelId);

      // Refresh data
      await Promise.all([fetchLevelConfigs(), fetchLevelProgress()]);
    } catch (error) {
      console.error('Error updating level pass score:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      Promise.all([
        fetchLevelConfigs(),
        fetchLevelProgress(),
        fetchExerciseProgress(),
      ]).finally(() => setLoading(false));
    }
  }, [user?.id]);

  return {
    levelProgress,
    exerciseProgress,
    levelConfigs,
    loading,
    recordItemProgress,
    updateLevelProgress,
    updateLevelPassScore,
    refreshProgress: () => Promise.all([
      fetchLevelConfigs(),
      fetchLevelProgress(),
      fetchExerciseProgress(),
    ]),
  };
};