
import React, { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import WordCard from '@/components/WordCard';

const WordLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data - in real app this would come from state/API
  const categories = [
    { id: 'all', name: 'All Words', emoji: '📚' },
    { id: 'animals', name: 'Animals', emoji: '🐾' },
    { id: 'family', name: 'Family', emoji: '👨‍👩‍👧‍👦' },
    { id: 'colors', name: 'Colors', emoji: '🌈' },
    { id: 'emotions', name: 'Emotions', emoji: '😊' },
    { id: 'food', name: 'Food', emoji: '🍎' },
  ];

  const words = [
    { id: 1, word: 'Cat', category: 'animals', difficulty: 'easy' as const, isCompleted: true, score: 92 },
    { id: 2, word: 'Dog', category: 'animals', difficulty: 'easy' as const, isCompleted: true, score: 88 },
    { id: 3, word: 'Elephant', category: 'animals', difficulty: 'hard' as const, isCompleted: false },
    { id: 4, word: 'Mom', category: 'family', difficulty: 'easy' as const, isCompleted: true, score: 95 },
    { id: 5, word: 'Sister', category: 'family', difficulty: 'medium' as const, isCompleted: false },
    { id: 6, word: 'Red', category: 'colors', difficulty: 'easy' as const, isCompleted: true, score: 90 },
    { id: 7, word: 'Blue', category: 'colors', difficulty: 'easy' as const, isCompleted: false },
    { id: 8, word: 'Happy', category: 'emotions', difficulty: 'medium' as const, isCompleted: true, score: 78 },
  ];

  const filteredWords = words.filter(word => {
    const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleWordClick = (wordId: number) => {
    console.log('Practice word:', wordId);
    // Navigate to practice page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 pb-20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Word Library 📚
          </h1>
          <p className="text-lg text-gray-600">
            Choose a word to practice!
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-lg"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-700">Categories</span>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all duration-200 whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{category.emoji}</span>
                <span className="font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Words Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredWords.map((word) => (
            <WordCard
              key={word.id}
              word={word.word}
              category={word.category}
              difficulty={word.difficulty}
              isCompleted={word.isCompleted}
              score={word.score}
              onClick={() => handleWordClick(word.id)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredWords.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No words found</h3>
            <p className="text-gray-600">Try searching for something else!</p>
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-8 bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Your Library Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">
                {words.filter(w => w.isCompleted).length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">
                {words.length - words.filter(w => w.isCompleted).length}
              </p>
              <p className="text-sm text-gray-600">To Practice</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">
                {words.length}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordLibrary;
