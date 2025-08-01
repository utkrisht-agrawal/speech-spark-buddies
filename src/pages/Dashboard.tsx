
import React from 'react';
import { Calendar, Award, Flame, Target, BookOpen, Mic } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';
import ProgressBar from '@/components/ProgressBar';
import DailyExerciseSection from '@/components/DailyExerciseSection';
import { useUserProgress } from '@/hooks/useUserProgress';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { userStats, todaysPractice, badges, loading } = useUserProgress();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Loading your progress...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}

        {/* Main Layout - Left and Right Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Section - Statistics */}
          <div className="space-y-6">
            {/* XP Progress */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-4">
                <Target className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold text-gray-800">Your Progress</h2>
              </div>
              <ProgressBar
                current={userStats.xp}
                max={userStats.maxXp}
                label="Experience Points"
                color="blue"
                size="lg"
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Streak Card */}
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="font-semibold text-gray-700">Streak</span>
                </div>
                <p className="text-3xl font-bold text-orange-500">{userStats.streak}</p>
                <p className="text-sm text-gray-600">Days in a row</p>
              </div>

              {/* Accuracy */}
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-gray-700">Accuracy</span>
                </div>
                <p className="text-3xl font-bold text-blue-500">{userStats.accuracy}%</p>
                <p className="text-sm text-gray-600">Average score</p>
              </div>
            </div>

            {/* Learning Progress Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Phonemes */}
              <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Mic className="w-4 h-4 text-purple-500" />
                  <span className="font-semibold text-gray-700 text-sm">Phonemes</span>
                </div>
                <p className="text-2xl font-bold text-purple-500">{userStats.phonemesLearned}</p>
                <p className="text-xs text-gray-600">Mastered</p>
              </div>

              {/* Words */}
              <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <BookOpen className="w-4 h-4 text-green-500" />
                  <span className="font-semibold text-gray-700 text-sm">Words</span>
                </div>
                <p className="text-2xl font-bold text-green-500">{userStats.wordsLearned}</p>
                <p className="text-xs text-gray-600">Learned</p>
              </div>

              {/* Sentences */}
              <div className="bg-white rounded-2xl p-3 shadow-lg border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-gray-700 text-sm">Sentences</span>
                </div>
                <p className="text-2xl font-bold text-indigo-500">{userStats.sentencesLearned}</p>
                <p className="text-xs text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          {/* Right Section - Daily Practice */}
          <div className="space-y-6">
            {user && (
              <DailyExerciseSection userId={user.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
