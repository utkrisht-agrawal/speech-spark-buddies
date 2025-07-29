
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Ready to practice some words?
          </p>
        </div>

        {/* Avatar Guide */}
        <div className="mb-8">
          <AvatarGuide 
            mood="happy"
            message="You're doing great! Let's keep learning!"
          />
        </div>

        {/* XP Progress */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-lg border border-gray-100">
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
        <div className="grid grid-cols-2 gap-4 mb-6">
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
        <div className="grid grid-cols-3 gap-3 mb-6">
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

        {/* Daily Exercises - New Section */}
        {user && (
          <div className="mb-6">
            <DailyExerciseSection userId={user.id} />
          </div>
        )}

        {/* Today's Practice */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-800">Today's Practice</h2>
          </div>
          <ProgressBar
            current={todaysPractice.completed}
            max={todaysPractice.target}
            label="Exercises completed today"
            color="purple"
            size="md"
          />
        </div>

        {/* Badge Collection */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Badges</h2>
          <div className="grid grid-cols-4 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={cn(
                  "aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 transition-all duration-200",
                  badge.earned 
                    ? "bg-yellow-50 border-yellow-300 hover:scale-105" 
                    : "bg-gray-50 border-gray-300 opacity-50"
                )}
              >
                <span className="text-2xl mb-1">{badge.icon}</span>
                <span className="text-xs font-medium text-center text-gray-700">
                  {badge.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="mt-8 space-y-4">
          {/* Viseme Practice */}
          <div className="bg-gradient-to-r from-purple-400 to-pink-500 rounded-2xl p-6 shadow-lg">
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-2">👄 Viseme Practice</h3>
              <p className="text-sm opacity-90 mb-4">Learn lip movements for better pronunciation!</p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('startVisemePractice'))}
                className="bg-white text-purple-600 font-bold py-3 px-6 rounded-xl hover:bg-purple-50 transition-all duration-200"
              >
                Start Learning! 📚
              </button>
            </div>
          </div>
          
          {/* Candle Blow Game */}
          <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-6 shadow-lg">
            <div className="text-center text-white">
              <h3 className="text-xl font-bold mb-2">🕯️ Candle Blow Game</h3>
              <p className="text-sm opacity-90 mb-4">Blow out candles with your voice!</p>
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('startCandleGame'))}
                className="bg-white text-orange-600 font-bold py-3 px-6 rounded-xl hover:bg-orange-50 transition-all duration-200"
              >
                Start Blowing! 💨
              </button>
            </div>
          </div>

          <div className="text-center">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105">
              Start Practicing! 🎯
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
