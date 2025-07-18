import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, Volume2, Users } from 'lucide-react';
import { CameraWindow } from '@/components/CameraWindow';

interface RolePlayRoomGameProps {
  onComplete: (score: number) => void;
  onBack: () => void;
}

const scenarios = [
  { 
    scene: 'Restaurant',
    character: 'Customer',
    prompt: 'Order your favorite meal',
    response: 'Thank you for your order!',
    icon: '🍽️'
  },
  { 
    scene: 'Doctor\'s Office',
    character: 'Patient',
    prompt: 'Describe how you feel',
    response: 'I understand, let me help you.',
    icon: '🏥'
  },
  { 
    scene: 'School',
    character: 'Student',
    prompt: 'Ask a question about math',
    response: 'Great question! Let me explain.',
    icon: '📚'
  },
  { 
    scene: 'Store',
    character: 'Shopper',
    prompt: 'Ask for help finding something',
    response: 'I\'d be happy to help you find that!',
    icon: '🛒'
  },
  { 
    scene: 'Park',
    character: 'Friend',
    prompt: 'Invite someone to play',
    response: 'That sounds like fun!',
    icon: '🌳'
  }
];

const RolePlayRoomGame: React.FC<RolePlayRoomGameProps> = ({ onComplete, onBack }) => {
  const [currentScenario, setCurrentScenario] = useState(scenarios[0]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [gameProgress, setGameProgress] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastSpeechTime = useRef(0);

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
    setFeedback(`You are a ${currentScenario.character} in a ${currentScenario.scene}. ${currentScenario.prompt}`);

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const nextScenario = () => {
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    setCurrentScenario(randomScenario);
    setShowResponse(false);
    setFeedback(`You are a ${randomScenario.character} in a ${randomScenario.scene}. ${randomScenario.prompt}`);
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
      
      // Role play detection logic
      const detected = level > 25;
      
      if (detected && Date.now() - lastSpeechTime.current > 2000) {
        lastSpeechTime.current = Date.now();
        const newScore = score + 15;
        setScore(newScore);
        setGameProgress(prev => prev + 1);
        setShowResponse(true);
        setFeedback(`Great role play! The other character responds...`);
        
        // Simulate character response
        setTimeout(() => {
          const utterance = new SpeechSynthesisUtterance(currentScenario.response);
          utterance.rate = 0.9;
          speechSynthesis.speak(utterance);
        }, 1000);
        
        if (gameProgress >= 7) {
          setIsGameComplete(true);
          setTimeout(() => onComplete(newScore), 3000);
        } else {
          setTimeout(nextScenario, 3000);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [score, gameProgress, currentScenario, onComplete]);

  const speakPrompt = () => {
    const utterance = new SpeechSynthesisUtterance(`You are a ${currentScenario.character} in a ${currentScenario.scene}. ${currentScenario.prompt}`);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  if (isGameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center p-4">
        <Card className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🎭</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Role Play Master!</h2>
          <p className="text-gray-600 mb-4">You've mastered social interactions!</p>
          <p className="text-xl font-semibold text-green-600">Final Score: {score}</p>
          <Button onClick={() => onComplete(score)} className="mt-4">
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Role Play Room</h1>
            <p className="text-sm text-gray-600">Practice social conversations!</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-green-600">Score: {score}</div>
            <div className="text-sm text-gray-600">{gameProgress}/8</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Scenario */}
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">{currentScenario.icon}</div>
            <h3 className="text-2xl font-bold mb-2">{currentScenario.scene}</h3>
            <div className="text-lg text-blue-600 mb-4">
              You are: {currentScenario.character}
            </div>
            <div className="text-gray-700 mb-4 p-4 bg-gray-50 rounded-lg">
              {currentScenario.prompt}
            </div>
            <Button 
              onClick={speakPrompt}
              variant="outline"
              className="mt-4"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Hear Scenario
            </Button>
          </Card>

          {/* Voice Input */}
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Your Response</h3>
            
            <div className="flex gap-4 justify-center items-center mb-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
                <div 
                  className="absolute inset-2 rounded-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-300"
                  style={{
                    transform: `scale(${Math.max(0.3, level / 100)})`,
                    opacity: Math.max(0.3, level / 100)
                  }}
                ></div>
                <Users className="absolute inset-0 m-auto w-6 h-6 text-white z-10" />
              </div>
              
              <CameraWindow 
                isActive={true}
                className="w-48 h-40"
              />
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Speaking Level</div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-400 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, level)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{feedback}</p>
              
              {showResponse && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-2">Character Response:</div>
                  <div className="text-gray-700 italic">"{currentScenario.response}"</div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Progress */}
        <Card className="mt-6 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Game Progress</span>
            <span className="text-sm text-gray-600">{gameProgress}/8</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(gameProgress / 8) * 100}%` }}
            ></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RolePlayRoomGame;