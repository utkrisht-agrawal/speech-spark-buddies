import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Target } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

interface PopTheBalloonGameProps {
  targetPhoneme?: string;
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const PopTheBalloonGame: React.FC<PopTheBalloonGameProps> = ({ 
  targetPhoneme = 'p',
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [balloons, setBalloons] = useState(Array.from({length: 8}, (_, i) => ({
    id: i,
    popped: false,
    x: Math.random() * 70 + 5, // Random position 5-75%
    y: Math.random() * 60 + 20, // Random position 20-80%
    color: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'][i % 8]
  })));
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentTarget, setCurrentTarget] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastPopTime = useRef(0);

  const startListening = async () => {
    try {
      setMicrophoneError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 512;
      analyserRef.current.smoothingTimeConstant = 0.8;
      microphone.connect(analyserRef.current);

      setIsListening(true);
      monitorAudio();
    } catch (error) {
      setMicrophoneError('Microphone access denied');
      setIsListening(false);
    }
  };

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsListening(false);
    setAudioLevel(0);
  }, []);

  const monitorAudio = () => {
    if (!analyserRef.current || !streamRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkAudio = () => {
      if (!analyserRef.current || !streamRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      const level = (average / 128) * 100;
      
      setAudioLevel(level);

      // Pop balloon if sound is strong enough
      if (level > 30 && Date.now() - lastPopTime.current > 500) {
        popBalloon();
        lastPopTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const popBalloon = () => {
    const availableBalloons = balloons.filter(b => !b.popped);
    if (availableBalloons.length === 0) return;

    const targetBalloon = availableBalloons[currentTarget % availableBalloons.length];
    setBalloons(prev => prev.map(b => 
      b.id === targetBalloon.id ? { ...b, popped: true } : b
    ));

    const newScore = score + 25;
    setScore(newScore);

    if (availableBalloons.length === 1) {
      setGameComplete(true);
      stopListening();
      onComplete?.(newScore);
    } else {
      setCurrentTarget(prev => (prev + 1) % availableBalloons.length);
    }
  };

  const resetGame = () => {
    setBalloons(Array.from({length: 8}, (_, i) => ({
      id: i,
      popped: false,
      x: Math.random() * 70 + 5,
      y: Math.random() * 60 + 20,
      color: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'][i % 8]
    })));
    setScore(0);
    setCurrentTarget(0);
    setGameComplete(false);
    setAudioLevel(0);
    stopListening();
  };

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            🎈 Pop the Sound Balloon
          </h1>
          <p className="text-gray-600">
            Say "/{targetPhoneme}/" sound to pop the balloons!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sound Level</span>
              <span className="text-sm font-normal">Score: {score}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={audioLevel} className="h-4 mb-2" />
            <p className="text-sm text-center text-gray-600">
              {audioLevel > 60 ? '🎉 Perfect sound!' : 
               audioLevel > 30 ? '📢 Good, louder!' : 
               '🔇 Speak up!'}
            </p>
            {microphoneError && (
              <p className="text-sm text-center text-red-600 mt-2">
                {microphoneError}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center mb-6">
          <AvatarGuide
            isListening={isListening}
            mood={gameComplete ? 'celebrating' : 'encouraging'}
            message={
              gameComplete ? '🎉 All balloons popped!' :
              isListening ? `Say "/${targetPhoneme}/" to pop the balloons!` :
              'Press start to begin popping balloons!'
            }
          />
        </div>

        {/* Game Area */}
        <Card className="mb-6 bg-gradient-to-b from-blue-100 to-blue-200">
          <CardContent className="p-8 relative h-96">
            <div className="absolute inset-0 overflow-hidden">
              {balloons.map((balloon) => (
                <div
                  key={balloon.id}
                  className={`absolute transition-all duration-500 ${
                    balloon.popped ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  style={{
                    left: `${balloon.x}%`,
                    top: `${balloon.y}%`,
                    transform: balloon.popped ? 'scale(0)' : 'scale(1)',
                  }}
                >
                  {!balloon.popped && (
                    <div className={`relative ${
                      currentTarget === balloons.filter(b => !b.popped).indexOf(balloon) 
                        ? 'animate-bounce ring-4 ring-yellow-300' : ''
                    }`}>
                      <div 
                        className={`w-16 h-20 rounded-full bg-${balloon.color}-400 border-2 border-${balloon.color}-500 shadow-lg`}
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${balloon.color === 'red' ? '#fca5a5' : 
                                                                        balloon.color === 'blue' ? '#93c5fd' :
                                                                        balloon.color === 'green' ? '#86efac' :
                                                                        balloon.color === 'yellow' ? '#fde047' :
                                                                        balloon.color === 'purple' ? '#c4b5fd' :
                                                                        balloon.color === 'orange' ? '#fdba74' :
                                                                        balloon.color === 'pink' ? '#f9a8d4' : '#67e8f9'}, 
                                      ${balloon.color === 'red' ? '#dc2626' : 
                                        balloon.color === 'blue' ? '#2563eb' :
                                        balloon.color === 'green' ? '#16a34a' :
                                        balloon.color === 'yellow' ? '#ca8a04' :
                                        balloon.color === 'purple' ? '#7c3aed' :
                                        balloon.color === 'orange' ? '#ea580c' :
                                        balloon.color === 'pink' ? '#db2777' : '#0891b2'})`
                        }}
                      />
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {balloons.every(b => b.popped) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-bounce">🎉</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!gameComplete ? (
            <>
              {!isListening ? (
                <Button onClick={startListening} className="bg-green-500 hover:bg-green-600">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Start Listening
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive">
                  Stop Listening
                </Button>
              )}
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-800">All Balloons Popped!</h3>
                <p className="text-green-700">You scored {score} points!</p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Play Again
                </Button>
                <Button 
                  onClick={() => onComplete?.(score)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Complete Game
                </Button>
                {onBack && (
                  <Button variant="outline" onClick={onBack}>
                    Back to Exercises
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {onBack && !gameComplete && (
          <div className="text-center mt-6">
            <Button variant="outline" onClick={onBack}>
              ← Back to Exercises
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PopTheBalloonGame;