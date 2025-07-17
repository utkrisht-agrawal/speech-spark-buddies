import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, Volume2 } from 'lucide-react';

interface EmotionMatchGameProps {
  onComplete: (score: number) => void;
  onBack: () => void;
}

const emotions = [
  { emotion: 'happy', emoji: '😊', color: 'text-yellow-500' },
  { emotion: 'sad', emoji: '😢', color: 'text-blue-500' },
  { emotion: 'angry', emoji: '😠', color: 'text-red-500' },
  { emotion: 'excited', emoji: '🤩', color: 'text-purple-500' },
  { emotion: 'calm', emoji: '😌', color: 'text-green-500' },
  { emotion: 'surprised', emoji: '😲', color: 'text-orange-500' }
];

const EmotionMatchGame: React.FC<EmotionMatchGameProps> = ({ onComplete, onBack }) => {
  const [currentEmotion, setCurrentEmotion] = useState(emotions[0]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [gameProgress, setGameProgress] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastMatchTime = useRef(0);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();
    nextEmotion();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const nextEmotion = () => {
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    setCurrentEmotion(randomEmotion);
    setFeedback(`Express "${randomEmotion.emotion}" with your voice!`);
  };

  const getAudioLevel = () => {
    if (!analyserRef.current) return 0;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return (average / 255) * 100;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const level = getAudioLevel();
      setLevel(level);
      
      // Emotion matching logic based on audio patterns
      const detected = level > 25;
      
      if (detected && Date.now() - lastMatchTime.current > 1500) {
        lastMatchTime.current = Date.now();
        const newScore = score + 10;
        setScore(newScore);
        setGameProgress(prev => prev + 1);
        setFeedback(`Great ${currentEmotion.emotion} expression! +10 points`);
        
        if (gameProgress >= 9) {
          setIsGameComplete(true);
          setTimeout(() => onComplete(newScore), 2000);
        } else {
          setTimeout(nextEmotion, 1500);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [score, gameProgress, currentEmotion, onComplete]);

  const speakEmotion = () => {
    const utterance = new SpeechSynthesisUtterance(currentEmotion.emotion);
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    speechSynthesis.speak(utterance);
  };

  if (isGameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center p-4">
        <Card className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Emotion Master!</h2>
          <p className="text-gray-600 mb-4">You've mastered emotional expression!</p>
          <p className="text-xl font-semibold text-purple-600">Final Score: {score}</p>
          <Button onClick={() => onComplete(score)} className="mt-4">
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Emotion Match</h1>
            <p className="text-sm text-gray-600">Express emotions with your voice!</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-purple-600">Score: {score}</div>
            <div className="text-sm text-gray-600">{gameProgress}/10</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Emotion */}
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Express This Emotion:</h3>
            <div className={`text-8xl mb-4 ${currentEmotion.color}`}>
              {currentEmotion.emoji}
            </div>
            <div className="text-2xl font-bold capitalize mb-4">
              {currentEmotion.emotion}
            </div>
            <Button 
              onClick={speakEmotion}
              variant="outline"
              className="mt-4"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Hear Example
            </Button>
          </Card>

          {/* Voice Level */}
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Voice Expression</h3>
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div 
                className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-300"
                style={{
                  transform: `scale(${Math.max(0.3, level / 100)})`,
                  opacity: Math.max(0.3, level / 100)
                }}
              ></div>
              <Mic className="absolute inset-0 m-auto w-8 h-8 text-white z-10" />
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Expression Level</div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-pink-400 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, level)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{feedback}</p>
            </div>
          </Card>
        </div>

        {/* Progress */}
        <Card className="mt-6 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Game Progress</span>
            <span className="text-sm text-gray-600">{gameProgress}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(gameProgress / 10) * 100}%` }}
            ></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EmotionMatchGame;