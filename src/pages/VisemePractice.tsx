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
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Practice Card - 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 h-full">
              
              {/* Header with Word Navigation */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-200">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">
                    {currentWord.word}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Word {currentWordIndex + 1} of {practiceWords.length}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreviousWord}
                    variant="outline"
                    size="sm"
                    disabled={currentWordIndex === 0}
                  >
                    ← Previous
                  </Button>
                  <Button
                    onClick={handleNextWord}
                    variant="outline"
                    size="sm"
                    disabled={currentWordIndex === practiceWords.length - 1}
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {/* Phoneme Division */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Phoneme Breakdown</h3>
                <div className="flex gap-2 mb-4">
                  {currentWord.phonemes.map((phoneme, index) => (
                    <Button
                      key={index}
                      onClick={() => setCurrentPhonemeIndex(index)}
                      variant={index === currentPhonemeIndex ? "default" : "outline"}
                      size="sm"
                      className={`min-w-[60px] ${
                        index === currentPhonemeIndex 
                          ? "bg-purple-600 text-white" 
                          : "bg-white text-gray-700 hover:bg-purple-50"
                      }`}
                    >
                      {phoneme}
                    </Button>
                  ))}
                </div>
                
                {/* Audio Controls */}
                <div className="flex gap-2 mb-6">
                  <Button
                    onClick={() => {
                      // Play full word audio
                      console.log(`Playing word: ${currentWord.word}`);
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-white"
                  >
                    🔊 Hear Word
                  </Button>
                  <Button
                    onClick={() => {
                      // Play current phoneme audio
                      console.log(`Playing phoneme: ${currentWord.phonemes[currentPhonemeIndex]}`);
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-white"
                  >
                    🔊 Hear Phoneme
                  </Button>
                </div>
              </div>

              {/* Lip Animation Guide */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Lip Animation Guide
                  </h3>
                  <div className="text-sm text-gray-600">
                    Current: <span className="font-semibold text-purple-600">
                      {currentWord.phonemes[currentPhonemeIndex]}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center mb-6 bg-gray-50 rounded-lg p-6">
                  <AnimatedLips
                    phoneme={currentWord.phonemes[currentPhonemeIndex]}
                    isAnimating={isAnimating}
                    className="transform scale-110"
                  />
                </div>
                
                {/* Animation Controls */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setCurrentPhonemeIndex(Math.max(0, currentPhonemeIndex - 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentPhonemeIndex === 0}
                  >
                    ← Prev
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setIsAnimating(!isAnimating);
                      if (!isAnimating) {
                        setTimeout(() => setIsAnimating(false), 3000);
                      }
                    }}
                    variant={isAnimating ? "destructive" : "default"}
                    size="sm"
                    className="flex-1"
                  >
                    {isAnimating ? "⏸️ Stop Animation" : "▶️ Play Animation"}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Play lip animation for entire word
                      setIsAnimating(true);
                      let phonemeIndex = 0;
                      const interval = setInterval(() => {
                        setCurrentPhonemeIndex(phonemeIndex);
                        phonemeIndex++;
                        if (phonemeIndex >= currentWord.phonemes.length) {
                          clearInterval(interval);
                          setIsAnimating(false);
                          setCurrentPhonemeIndex(0);
                        }
                      }, 800);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    🔄 Loop Word
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentPhonemeIndex(Math.min(currentWord.phonemes.length - 1, currentPhonemeIndex + 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentPhonemeIndex === currentWord.phonemes.length - 1}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Practice & Analysis Card - 1/3 width */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-white border-2 border-green-200 h-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Practice & Analysis
              </h3>
              
              {/* Camera Widget */}
              <div className="mb-6">
                <CameraWindow
                  isActive={isCameraActive}
                  className="h-48 rounded-lg"
                />
              </div>
              
              {/* Sound Waveform */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Sound Waveform</h4>
                <div className="h-16 bg-gradient-to-r from-green-200 to-blue-200 rounded flex items-center justify-center">
                  <div className="flex items-end gap-1 h-12">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-green-500 w-1 rounded-t"
                        style={{
                          height: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Recording audio input...
                </p>
              </div>
              
              {/* Scoring Section */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Lip Shape Score</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: '75%' }}
                      />
                    </div>
                    <span className="text-sm font-bold text-blue-600">75%</span>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="text-sm font-semibold text-green-800 mb-2">Sound Match Score</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-green-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: '80%' }}
                      />
                    </div>
                    <span className="text-sm font-bold text-green-600">80%</span>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-800 mb-2">Overall Score</h4>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{score}</div>
                    <div className="text-xs text-purple-700">Total Points</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
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