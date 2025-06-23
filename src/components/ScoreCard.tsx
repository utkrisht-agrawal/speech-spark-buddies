
import React from 'react';
import { Star, Trophy, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreCardProps {
  score: number;
  targetWord: string;
  spokenWord: string;
  onRetry?: () => void;
  onNext?: () => void;
}

const ScoreCard = ({ score, targetWord, spokenWord, onRetry, onNext }: ScoreCardProps) => {
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreMessage = () => {
    if (score >= 90) return "Excellent! 🌟";
    if (score >= 80) return "Great job! 👏";
    if (score >= 60) return "Good try! 👍";
    return "Keep practicing! 💪";
  };

  const getStars = () => {
    const starCount = Math.ceil(score / 20);
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "w-6 h-6",
          i < starCount ? "text-yellow-400 fill-current" : "text-gray-300"
        )}
      />
    ));
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-gray-100 animate-scale-in">
      {/* Score Display */}
      <div className="text-center mb-6">
        <div className={cn("text-6xl font-bold mb-2", getScoreColor())}>
          {score}
        </div>
        <div className="flex justify-center space-x-1 mb-3">
          {getStars()}
        </div>
        <p className="text-xl font-semibold text-gray-700">
          {getScoreMessage()}
        </p>
      </div>

      {/* Word Comparison */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Target className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-700">Target Word</span>
        </div>
        <p className="text-2xl font-bold text-center text-blue-600 mb-4">
          {targetWord}
        </p>
        
        <div className="flex items-center justify-center space-x-2 mb-3">
          <span className="font-semibold text-gray-700">You Said</span>
        </div>
        <p className="text-2xl font-bold text-center text-purple-600">
          {spokenWord}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 bg-orange-400 hover:bg-orange-500 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            Try Again
          </button>
        )}
        
        {onNext && (
          <button
            onClick={onNext}
            className="flex-1 bg-green-400 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <span>Next Word</span>
            <Trophy className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ScoreCard;
