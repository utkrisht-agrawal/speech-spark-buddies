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
  const [isLooping, setIsLooping] = useState(false);
  const [loopInterval, setLoopInterval] = useState<NodeJS.Timeout | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(800);

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
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800">Viseme Practice</h1>
          <p className="text-xs text-gray-600">
            Word {currentWordIndex + 1} of {practiceWords.length}
          </p>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <Star className="w-3 h-3 text-yellow-500" />
          <span className="font-semibold text-xs">{score}</span>
        </div>
      </div>

      {/* Main Content - No scroll */}
      <div className="flex-1 max-w-full mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
          
          {/* Main Practice Card - 2/3 width */}
          <div className="lg:col-span-2 h-full">
            <Card className="p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 h-full flex flex-col">
              
              {/* Compact Header with Word Navigation */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {currentWord.word}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {currentWordIndex + 1} / {practiceWords.length}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    onClick={handlePreviousWord}
                    variant="outline"
                    size="sm"
                    disabled={currentWordIndex === 0}
                    className="h-8 px-2 text-xs"
                  >
                    ← Prev
                  </Button>
                  <Button
                    onClick={handleNextWord}
                    variant="outline"
                    size="sm"
                    disabled={currentWordIndex === practiceWords.length - 1}
                    className="h-8 px-2 text-xs"
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {/* Phoneme Division */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Phonemes</h3>
                <div className="flex gap-1 mb-3 flex-wrap">
                  {currentWord.phonemes.map((phoneme, index) => (
                    <Button
                      key={index}
                      onClick={() => setCurrentPhonemeIndex(index)}
                      variant={index === currentPhonemeIndex ? "default" : "outline"}
                      size="sm"
                      className={`min-w-[50px] h-7 text-xs ${
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
                <div className="flex gap-2 mb-3">
                  <Button
                    onClick={() => {
                      // Text-to-speech for word
                      const utterance = new SpeechSynthesisUtterance(currentWord.word);
                      utterance.rate = 0.8;
                      speechSynthesis.speak(utterance);
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-white h-7 text-xs"
                  >
                    🔊 Word
                  </Button>
                  <Button
                    onClick={() => {
                      // Text-to-speech for phoneme
                      const utterance = new SpeechSynthesisUtterance(currentWord.phonemes[currentPhonemeIndex]);
                      utterance.rate = 0.6;
                      speechSynthesis.speak(utterance);
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-white h-7 text-xs"
                  >
                    🔊 Phoneme
                  </Button>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-gray-600">Speed:</span>
                    <select 
                      className="text-xs border rounded px-1 py-0.5"
                      onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                      value={animationSpeed}
                    >
                      <option value={1200}>Slow</option>
                      <option value={800}>Normal</option>
                      <option value={500}>Fast</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lip Animation Guide - Flexible height */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Lip Animation Guide
                  </h3>
                  <div className="text-xs text-gray-600">
                    Current: <span className="font-semibold text-purple-600">
                      {currentWord.phonemes[currentPhonemeIndex]}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center flex-1 bg-gray-50 rounded-lg p-3 mb-3">
                  <AnimatedLips
                    phoneme={currentWord.phonemes[currentPhonemeIndex]}
                    isAnimating={isAnimating}
                    className="transform scale-90"
                  />
                </div>
                
                {/* Animation Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPhonemeIndex(Math.max(0, currentPhonemeIndex - 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentPhonemeIndex === 0}
                    className="h-7 px-2 text-xs"
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
                    className="flex-1 h-7 text-xs"
                  >
                    {isAnimating ? "⏸️ Stop" : "▶️ Play"}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Enhanced loop with speed control
                      if (isLooping) {
                        setIsLooping(false);
                        clearInterval(loopInterval);
                        setIsAnimating(false);
                        return;
                      }
                      
                      setIsLooping(true);
                      setIsAnimating(true);
                      let phonemeIndex = 0;
                      
                      const interval = setInterval(() => {
                        setCurrentPhonemeIndex(phonemeIndex);
                        phonemeIndex++;
                        if (phonemeIndex >= currentWord.phonemes.length) {
                          phonemeIndex = 0; // Loop back to start
                        }
                      }, animationSpeed);
                      
                      setLoopInterval(interval);
                    }}
                    variant={isLooping ? "destructive" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                  >
                    {isLooping ? "⏹️ Stop Loop" : "🔄 Loop"}
                  </Button>
                  
                  <Button
                    onClick={() => setCurrentPhonemeIndex(Math.min(currentWord.phonemes.length - 1, currentPhonemeIndex + 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentPhonemeIndex === currentWord.phonemes.length - 1}
                    className="h-7 px-2 text-xs"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Practice & Analysis Card - 1/3 width */}
          <div className="lg:col-span-1 h-full">
            <Card className="p-4 bg-white border-2 border-green-200 h-full flex flex-col">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Practice & Analysis
              </h3>
              
              {/* Camera Widget */}
              <div className="mb-4 flex-1">
                <CameraWindow
                  isActive={isCameraActive}
                  className="h-32 sm:h-40 lg:h-48 rounded-lg w-full"
                />
              </div>
              
              {/* Sound Waveform */}
              <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Sound Waveform</h4>
                <div className="h-10 bg-gradient-to-r from-green-200 to-blue-200 rounded flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-8">
                    {[...Array(15)].map((_, i) => (
                      <div
                        key={i}
                        className="bg-green-500 w-1 rounded-t animate-pulse"
                        style={{
                          height: `${20 + Math.random() * 80}%`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Recording...
                </p>
              </div>
              
              {/* Compact Scoring Section */}
              <div className="space-y-2">
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <h4 className="text-xs font-semibold text-blue-800 mb-1">Lip Shape</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: '75%' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-blue-600">75%</span>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <h4 className="text-xs font-semibold text-green-800 mb-1">Sound Match</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-green-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: '80%' }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-600">80%</span>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                  <h4 className="text-xs font-semibold text-purple-800 mb-1">Overall Score</h4>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{score}</div>
                    <div className="text-xs text-purple-700">Points</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Compact Instructions */}
        <div className="mt-3">
          <Card className="p-3 bg-blue-50 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-1">
              💡 Tips
            </h4>
            <div className="text-xs text-blue-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>• Watch viseme guide</div>
              <div>• Copy lip shapes</div>
              <div>• Check with camera</div>
              <div>• Practice slowly</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisemePractice;