
import React from 'react';
import { Calendar, Award, Flame, Target } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';
import ProgressBar from '@/components/ProgressBar';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  // Mock data - in real app this would come from state/API
  const userStats = {
    xp: 1250,
    maxXp: 2000,
    streak: 7,
    wordsLearned: 45,
    accuracy: 82,
  };

  const recentBadges = [
    { id: 1, name: 'Word Warrior', icon: '🏆', earned: true },
    { id: 2, name: '7-Day Streak', icon: '🔥', earned: true },
    { id: 3, name: 'Perfect Score', icon: '⭐', earned: false },
    { id: 4, name: 'Animal Expert', icon: '🐾', earned: true },
  ];

  const todayPractice = {
    completed: 8,
    target: 10,
  };

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

          {/* Words Learned */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-2 mb-2">
              <Award className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-700">Words</span>
            </div>
            <p className="text-3xl font-bold text-green-500">{userStats.wordsLearned}</p>
            <p className="text-sm text-gray-600">Learned</p>
          </div>
        </div>

        {/* Today's Practice */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-lg border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-bold text-gray-800">Today's Practice</h2>
          </div>
          <ProgressBar
            current={todayPractice.completed}
            max={todayPractice.target}
            label="Words practiced today"
            color="purple"
            size="md"
          />
        </div>

        {/* Badge Collection */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Badges</h2>
          <div className="grid grid-cols-4 gap-3">
            {recentBadges.map((badge) => (
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
