
import React from 'react';
import { cn } from '@/lib/utils';

interface WordCardProps {
  word: string;
  imageUrl?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCompleted?: boolean;
  onClick?: () => void;
  score?: number;
}

const WordCard = ({ 
  word, 
  imageUrl, 
  category,
  difficulty, 
  isCompleted = false,
  onClick,
  score 
}: WordCardProps) => {
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'border-green-300 bg-green-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'hard': return 'border-red-300 bg-red-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getDifficultyDots = () => {
    const dots = [];
    for (let i = 0; i < 3; i++) {
      dots.push(
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full",
            i < (difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3)
              ? "bg-current"
              : "bg-gray-300"
          )}
        />
      );
    }
    return dots;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-2xl border-3 cursor-pointer transition-all duration-200",
        "hover:scale-105 hover:shadow-lg",
        getDifficultyColor(),
        isCompleted && "ring-2 ring-green-400 ring-offset-2"
      )}
    >
      {/* Completion Badge */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
          <span className="text-white text-lg">✓</span>
        </div>
      )}

      {/* Score Badge */}
      {score && (
        <div className="absolute top-2 right-2 bg-blue-400 text-white px-2 py-1 rounded-full text-sm font-bold">
          {score}%
        </div>
      )}

      {/* Image placeholder */}
      <div className="w-full h-24 bg-gray-200 rounded-xl mb-3 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={word} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-4xl">🎯</span>
        )}
      </div>

      {/* Word */}
      <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
        {word}
      </h3>

      {/* Category and Difficulty */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600 capitalize">
          {category}
        </span>
        <div className="flex space-x-1">
          {getDifficultyDots()}
        </div>
      </div>
    </div>
  );
};

export default WordCard;
