import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { getPhonemeSequence } from '@/utils/phonemeAPI';

interface VisemeData {
  phoneme: string;
  viseme: string;
  description: string;
  shape: 'circle' | 'oval' | 'line' | 'smile' | 'frown' | 'pucker' | 'open';
  color: string;
}

interface VisemeGuideProps {
  word?: string;
  phonemes?: string[];
  className?: string;
  onComplete?: () => void;
  useDynamicPhonemes?: boolean; // Enable dynamic phoneme loading
}

// Viseme mapping for common phonemes
const visemeMap: Record<string, VisemeData> = {
  'AH': { phoneme: 'AH', viseme: 'A', description: 'Open mouth wide', shape: 'open', color: '#FF6B6B' },
  'EH': { phoneme: 'EH', viseme: 'E', description: 'Medium open, corners back', shape: 'oval', color: '#4ECDC4' },
  'IH': { phoneme: 'IH', viseme: 'I', description: 'Small opening, corners back', shape: 'line', color: '#45B7D1' },
  'OH': { phoneme: 'OH', viseme: 'O', description: 'Round lips, medium opening', shape: 'circle', color: '#96CEB4' },
  'UH': { phoneme: 'UH', viseme: 'U', description: 'Round lips, small opening', shape: 'pucker', color: '#FECA57' },
  'B': { phoneme: 'B', viseme: 'B/P/M', description: 'Lips closed together', shape: 'line', color: '#FF9FF3' },
  'P': { phoneme: 'P', viseme: 'B/P/M', description: 'Lips closed together', shape: 'line', color: '#FF9FF3' },
  'M': { phoneme: 'M', viseme: 'B/P/M', description: 'Lips closed together', shape: 'line', color: '#FF9FF3' },
  'F': { phoneme: 'F', viseme: 'F/V', description: 'Bottom lip to top teeth', shape: 'frown', color: '#54A0FF' },
  'V': { phoneme: 'V', viseme: 'F/V', description: 'Bottom lip to top teeth', shape: 'frown', color: '#54A0FF' },
  'TH': { phoneme: 'TH', viseme: 'TH', description: 'Tongue between teeth', shape: 'smile', color: '#5F27CD' },
  'S': { phoneme: 'S', viseme: 'S/Z', description: 'Teeth almost closed', shape: 'smile', color: '#00D2D3' },
  'Z': { phoneme: 'Z', viseme: 'S/Z', description: 'Teeth almost closed', shape: 'smile', color: '#00D2D3' },
};

// Default phonemes for demonstration
const defaultPhonemes = ['AH', 'EH', 'IH', 'OH', 'UH'];

export const VisemeGuide: React.FC<VisemeGuideProps> = ({ 
  word = "HELLO", 
  phonemes = defaultPhonemes,
  className = "",
  onComplete,
  useDynamicPhonemes = false
}) => {
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [dynamicPhonemes, setDynamicPhonemes] = useState<string[]>([]);
  const [phonemesLoaded, setPhonemesLoaded] = useState(!useDynamicPhonemes);

  // Use dynamic phonemes if enabled and loaded, otherwise use provided phonemes
  const activePhonemes = useDynamicPhonemes && dynamicPhonemes.length > 0 ? dynamicPhonemes : phonemes;
  const currentPhoneme = activePhonemes[currentPhonemeIndex];
  const currentViseme = visemeMap[currentPhoneme] || visemeMap['AH'];

  // Load dynamic phonemes when word changes
  useEffect(() => {
    if (useDynamicPhonemes) {
      const loadPhonemes = async () => {
        try {
          console.log(`📝 Loading phonemes for word: "${word}"`);
          const sequence = await getPhonemeSequence(word);
          setDynamicPhonemes(sequence);
          setPhonemesLoaded(true);
          setCurrentPhonemeIndex(0); // Reset index when new phonemes are loaded
        } catch (error) {
          console.error('Failed to load phonemes, using fallback:', error);
          setDynamicPhonemes(word.toLowerCase().split(''));
          setPhonemesLoaded(true);
        }
      };
      
      loadPhonemes();
    }
  }, [word, useDynamicPhonemes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentPhonemeIndex < activePhonemes.length && phonemesLoaded) {
      interval = setInterval(() => {
        setCurrentPhonemeIndex(prev => {
          if (prev >= activePhonemes.length - 1) {
            setIsPlaying(false);
            onComplete?.();
            return 0; // Reset to beginning
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentPhonemeIndex, activePhonemes.length, playbackSpeed, onComplete, phonemesLoaded]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const resetSequence = () => {
    setCurrentPhonemeIndex(0);
    setIsPlaying(false);
  };

  const nextPhoneme = () => {
    setCurrentPhonemeIndex(prev => 
      prev >= activePhonemes.length - 1 ? 0 : prev + 1
    );
  };

  const renderLipShape = (shape: VisemeData['shape'], color: string) => {
    const baseStyle = "transition-all duration-500 ease-in-out";
    
    switch (shape) {
      case 'circle':
        return (
          <div 
            className={`w-16 h-16 rounded-full border-4 ${baseStyle}`}
            style={{ borderColor: color, backgroundColor: `${color}20` }}
          />
        );
      case 'oval':
        return (
          <div 
            className={`w-20 h-12 rounded-full border-4 ${baseStyle}`}
            style={{ borderColor: color, backgroundColor: `${color}20` }}
          />
        );
      case 'line':
        return (
          <div 
            className={`w-16 h-2 rounded-full border-2 ${baseStyle}`}
            style={{ borderColor: color, backgroundColor: color }}
          />
        );
      case 'smile':
        return (
          <div 
            className={`w-16 h-8 border-4 border-t-0 rounded-b-full ${baseStyle}`}
            style={{ borderColor: color }}
          />
        );
      case 'frown':
        return (
          <div 
            className={`w-16 h-8 border-4 border-b-0 rounded-t-full ${baseStyle}`}
            style={{ borderColor: color }}
          />
        );
      case 'pucker':
        return (
          <div 
            className={`w-10 h-10 rounded-full border-4 ${baseStyle}`}
            style={{ borderColor: color, backgroundColor: `${color}20` }}
          />
        );
      case 'open':
        return (
          <div 
            className={`w-20 h-20 rounded-full border-4 ${baseStyle}`}
            style={{ borderColor: color, backgroundColor: `${color}20` }}
          />
        );
      default:
        return (
          <div 
            className={`w-16 h-16 rounded-full border-4 ${baseStyle}`}
            style={{ borderColor: color, backgroundColor: `${color}20` }}
          />
        );
    }
  };

  const speakPhoneme = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentPhoneme);
      utterance.rate = 0.5;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className={`p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Viseme Guide
        </h3>
        <p className="text-sm text-gray-600">
          Practice word: <span className="font-semibold text-purple-600">{word}</span>
        </p>
      </div>

      {/* Current Phoneme Display */}
      <div className="text-center mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-4">
          <div className="flex items-center justify-center mb-4">
            {renderLipShape(currentViseme.shape, currentViseme.color)}
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold" style={{ color: currentViseme.color }}>
              {currentViseme.phoneme}
            </div>
            <div className="text-sm text-gray-600">
              {currentViseme.description}
            </div>
            <div className="text-xs bg-gray-100 px-3 py-1 rounded-full inline-block">
              Viseme: {currentViseme.viseme}
            </div>
          </div>
        </div>

        {/* Audio Button */}
        <Button
          onClick={speakPhoneme}
          variant="outline"
          size="sm"
          className="mb-4"
        >
          <Volume2 className="w-4 h-4 mr-2" />
          Hear Sound
        </Button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        {!phonemesLoaded ? (
          <div className="text-center">
            <div className="text-sm text-gray-600">Loading phonemes...</div>
            <div className="animate-pulse flex justify-center space-x-2 mt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-gray-300 rounded-full" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center space-x-2 mb-2">
              {activePhonemes.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentPhonemeIndex 
                      ? 'bg-purple-500 scale-110' 
                      : index < currentPhonemeIndex 
                        ? 'bg-green-400' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-center text-gray-500">
              {currentPhonemeIndex + 1} of {activePhonemes.length}
            </p>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-2 mb-4">
        <Button
          onClick={togglePlayback}
          variant={isPlaying ? "default" : "outline"}
          size="sm"
          disabled={!phonemesLoaded}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          onClick={resetSequence}
          variant="outline"
          size="sm"
          disabled={!phonemesLoaded}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          onClick={nextPhoneme}
          variant="outline"
          size="sm"
          disabled={isPlaying || !phonemesLoaded}
        >
          Next
        </Button>
      </div>

      {/* Speed Control */}
      <div className="text-center">
        <label className="text-xs text-gray-600 block mb-2">
          Speed: {playbackSpeed}ms
        </label>
        <input
          type="range"
          min="500"
          max="3000"
          step="250"
          value={playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </Card>
  );
};