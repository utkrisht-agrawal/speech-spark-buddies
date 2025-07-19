import React, { useState } from 'react';
import { ArrowLeft, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CameraWindow } from '@/components/CameraWindow';
import { VisemeGuide } from '@/components/VisemeGuide';
import ScoreCard from '@/components/ScoreCard';
import AnimatedLips from '@/components/AnimatedLips';

interface VisemePracticeProps {
  onBack?: () => void;
  onComplete?: (score: number) => void;
}

// Sample words with their phoneme breakdowns
const practiceWords = [
  { word: "HELLO", phonemes: ['H', 'EH', 'L', 'OH'] },
  { word: "APPLE", phonemes: ['AH', 'P', 'AH', 'L'] },
  { word: "MOTHER", phonemes: ['M', 'AH', 'TH', 'ER'] },
  { word: "FISH", phonemes: ['F', 'IH', 'S', 'H'] },
  { word: "BOOK", phonemes: ['B', 'UH', 'K'] },
  { word: "WATER", phonemes: ['W', 'AH', 'T', 'ER'] },
];

const VisemePractice: React.FC<VisemePracticeProps> = ({ onBack, onComplete }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentWord = practiceWords[currentWordIndex];

  const handleVisemeComplete = () => {
    const newScore = score + 10;
    setScore(newScore);
    setAttempts(attempts + 1);

    if (currentWordIndex < practiceWords.length - 1) {
      // Move to next word after a short delay
      setTimeout(() => {
        setCurrentWordIndex(currentWordIndex + 1);
      }, 1500);
    } else {
      // Practice session complete
      setIsComplete(true);
      onComplete?.(newScore);
    }
  };

  const handleRestart = () => {
    setCurrentWordIndex(0);
    setScore(0);
    setAttempts(0);
    setIsComplete(false);
  };

  const handleNextWord = () => {
    if (currentWordIndex < practiceWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card className="p-8 text-center bg-white border-2 border-green-200">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Viseme Practice Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Great job practicing lip movements!
            </p>
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="text-3xl font-bold text-green-600">{score}</div>
              <div className="text-sm text-green-700">Total Score</div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRestart}
                variant="outline"
                className="flex-1"
              >
                Practice Again
              </Button>
              <Button
                onClick={onBack}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">Viseme Practice</h1>
          <p className="text-sm text-gray-600">
            Word {currentWordIndex + 1} of {practiceWords.length}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Star className="w-4 h-4 text-yellow-500" />
          <span className="font-semibold">{score}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Merged Viseme Guide + Animated Lips - Left Two Columns */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                
                {/* Viseme Guide Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Viseme Guide
                  </h3>
                  <VisemeGuide
                    word={currentWord.word}
                    phonemes={currentWord.phonemes}
                    onComplete={handleVisemeComplete}
                    className="h-auto"
                  />
                </div>

                {/* Animated Lips Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">
                    Lip Animation Guide
                  </h3>
                  <p className="text-sm text-gray-600">
                    Watch the lip movements for each sound
                  </p>
                  
                  <div className="flex items-center justify-center bg-white rounded-xl p-4 border border-gray-100">
                    <AnimatedLips
                      phoneme={currentWord.phonemes[currentPhonemeIndex]}
                      isAnimating={isAnimating}
                      className="transform scale-125"
                    />
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Current Word:</p>
                    <p className="text-2xl font-bold text-purple-600 mb-2">
                      {currentWord.word}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phoneme {currentPhonemeIndex + 1} of {currentWord.phonemes.length}: 
                      <span className="font-semibold ml-1">{currentWord.phonemes[currentPhonemeIndex]}</span>
                    </p>
                  </div>
                  
                  {/* Phoneme Navigation */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPhonemeIndex(Math.max(0, currentPhonemeIndex - 1))}
                      variant="outline"
                      size="sm"
                      disabled={currentPhonemeIndex === 0}
                    >
                      ← Prev Sound
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAnimating(!isAnimating);
                        setTimeout(() => setIsAnimating(false), 2000);
                      }}
                      variant="default"
                      size="sm"
                      className="flex-1"
                    >
                      {isAnimating ? 'Stop' : 'Animate'}
                    </Button>
                    <Button
                      onClick={() => setCurrentPhonemeIndex(Math.min(currentWord.phonemes.length - 1, currentPhonemeIndex + 1))}
                      variant="outline"
                      size="sm"
                      disabled={currentPhonemeIndex === currentWord.phonemes.length - 1}
                    >
                      Next Sound →
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Word Navigation - Now inside the merged card */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800">
                    Word Navigation
                  </h4>
                  <span className="text-sm text-gray-500">
                    Word {currentWordIndex + 1} of {practiceWords.length}
                  </span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handlePreviousWord}
                    variant="outline"
                    size="sm"
                    disabled={currentWordIndex === 0}
                  >
                    ← Previous Word
                  </Button>
                  
                  <Button
                    onClick={handleNextWord}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    Next Word →
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Camera Window - Right Column */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <CameraWindow
                isActive={isCameraActive}
                className="h-64 lg:h-80"
              />
              
              <Card className="p-4 bg-white border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">
                  Your Practice
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Follow the viseme guide and practice the lip movements for each sound.
                </p>
                
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">Current Score</span>
                    <span className="text-lg font-bold text-green-600">{score}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8">
          <Card className="p-4 bg-white border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-500">
                {Math.round((currentWordIndex / practiceWords.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentWordIndex / practiceWords.length) * 100}%` }}
              />
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <div className="mt-6">
          <Card className="p-4 bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              💡 How to Practice
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Watch the viseme guide show each sound</li>
              <li>• Copy the lip shape and mouth position</li>
              <li>• Use your camera to check your movements</li>
              <li>• Practice each phoneme slowly and carefully</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisemePractice;