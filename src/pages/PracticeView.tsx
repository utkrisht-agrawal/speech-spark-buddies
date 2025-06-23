
import React, { useState } from 'react';
import { ArrowLeft, Volume2 } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';
import RecordButton from '@/components/RecordButton';
import ScoreCard from '@/components/ScoreCard';

const PracticeView = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  // Mock data - in real app this would come from props/route params
  const currentWord = {
    word: 'Cat',
    category: 'animals',
    imageUrl: undefined, // Will show emoji placeholder
  };

  const mockResults = {
    score: 85,
    spokenWord: 'Kat',
  };

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    
    // Simulate recording completion
    if (isRecording) {
      setHasRecorded(true);
      // In real app, this would trigger speech recognition
      setTimeout(() => {
        setShowScore(true);
      }, 1000);
    }
  };

  const handleRetry = () => {
    setShowScore(false);
    setHasRecorded(false);
    setIsRecording(false);
  };

  const handleNext = () => {
    // Navigate to next word
    console.log('Next word');
  };

  const handlePlayPronunciation = () => {
    // In real app, this would play the correct pronunciation
    console.log('Playing pronunciation for:', currentWord.word);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Practice Time!</h1>
            <p className="text-gray-600 capitalize">{currentWord.category} • Level 1</p>
          </div>
        </div>

        {/* Word Display */}
        <div className="bg-white rounded-3xl p-8 mb-8 shadow-xl border border-gray-100 text-center">
          {/* Word Image */}
          <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-2xl flex items-center justify-center">
            <span className="text-6xl">🐱</span>
          </div>

          {/* Word Text */}
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {currentWord.word}
          </h2>

          {/* Pronunciation Button */}
          <button
            onClick={handlePlayPronunciation}
            className="bg-blue-100 hover:bg-blue-200 text-blue-600 px-6 py-3 rounded-xl font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <Volume2 className="w-5 h-5" />
            <span>Hear Pronunciation</span>
          </button>
        </div>

        {/* Avatar Guide */}
        <div className="mb-8">
          <AvatarGuide
            isListening={isRecording}
            isSpeaking={false}
            mood={hasRecorded ? 'encouraging' : 'happy'}
            message={
              isRecording 
                ? "I'm listening..." 
                : hasRecorded 
                  ? "Processing your speech..." 
                  : "Say the word clearly!"
            }
          />
        </div>

        {/* Recording Interface */}
        {!showScore && (
          <div className="text-center mb-8">
            <RecordButton
              isRecording={isRecording}
              onToggleRecording={handleToggleRecording}
            />
            
            {hasRecorded && !isRecording && (
              <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
                <p className="text-lg font-semibold text-blue-700">
                  Processing your speech...
                </p>
                <div className="flex justify-center space-x-1 mt-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Score Display */}
        {showScore && (
          <div className="mb-8">
            <ScoreCard
              score={mockResults.score}
              targetWord={currentWord.word}
              spokenWord={mockResults.spokenWord}
              onRetry={handleRetry}
              onNext={handleNext}
            />
          </div>
        )}

        {/* Waveform Visualization (Mock) */}
        {hasRecorded && !showScore && (
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
              Your Recording
            </h3>
            <div className="flex items-center justify-center space-x-1 h-16">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="bg-purple-400 rounded-full w-1"
                  style={{
                    height: `${Math.random() * 60 + 10}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeView;
