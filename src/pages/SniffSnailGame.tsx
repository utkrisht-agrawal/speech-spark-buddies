import React, { useState, useEffect, useRef, useCallback } from 'react';
import { scoreSpeech } from '@/utils/speechRecognition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Wind } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

interface SniffSnailGameProps {
  targetPhonemes?: string[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const SniffSnailGame: React.FC<SniffSnailGameProps> = ({ 
  targetPhonemes = ['m', 'n'],
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [snailPosition, setSnailPosition] = useState(0);
  const [flowersCollected, setFlowersCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [nasalDetected, setNasalDetected] = useState(false);
  const [currentPhoneme, setCurrentPhoneme] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastMoveTime = useRef(0);
  const isCheckingRef = useRef(false);

  const recordAudioSample = (duration = 1000): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!streamRef.current) {
        reject(new Error('No audio stream'));
        return;
      }
      const recorder = new MediaRecorder(streamRef.current);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: 'audio/webm' }));
      };
      recorder.start();
      setTimeout(() => recorder.stop(), duration);
    });
  };

  const checkForPhoneme = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      const audioBlob = await recordAudioSample();
      const phoneme = getCurrentPhoneme();
      const result = await scoreSpeech(audioBlob, phoneme, 'phoneme');
      if (result.similarityScore >= 75) {
        moveSnail();
      }
    } catch (err) {
      console.error('Phoneme check failed', err);
    } finally {
      isCheckingRef.current = false;
    }
  };

  const gardenLength = 100;
  const flowersNeeded = 5;
  const flowerPositions = [20, 40, 60, 80, 100];

  const startListening = async () => {
    try {
      setMicrophoneError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const microphone = audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
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
    setNasalDetected(false);
  }, []);

  const monitorAudio = () => {
    if (!analyserRef.current || !streamRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const checkAudio = () => {
      if (!analyserRef.current || !streamRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Focus on lower frequencies for nasal sounds (100-400Hz range)
      const nasalRange = Math.floor(dataArray.length * 0.2); // First 20% of frequencies
      let nasalSum = 0;
      for (let i = 0; i < nasalRange; i++) {
        nasalSum += dataArray[i];
      }
      
      const nasalAverage = nasalSum / nasalRange;
      const level = Math.min((nasalAverage / 40) * 100, 100);
      
      setAudioLevel(level);
      
      // Detect nasal sounds (m, n sounds have more energy in lower frequencies)
      const isNasal = level > 25;
      setNasalDetected(isNasal);

      // Move snail if nasal sound detected
      if (isNasal && Date.now() - lastMoveTime.current > 500) {
        checkForPhoneme();
        lastMoveTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const moveSnail = () => {
    const movement = 5 + Math.random() * 5; // Move 5-10 units
    const newPosition = Math.min(snailPosition + movement, gardenLength);
    setSnailPosition(newPosition);
    
    // Check for flower collection
    const nearbyFlower = flowerPositions.find(pos => 
      Math.abs(newPosition - pos) < 8 && pos > snailPosition
    );
    
    if (nearbyFlower) {
      const newFlowersCollected = flowersCollected + 1;
      const newScore = score + 50;
      setFlowersCollected(newFlowersCollected);
      setScore(newScore);
      
      if (newFlowersCollected >= flowersNeeded) {
        setGameComplete(true);
        stopListening();
        onComplete?.(newScore);
      }
    } else {
      setScore(prev => prev + 5); // Small points for movement
    }
  };

  const resetGame = () => {
    setSnailPosition(0);
    setFlowersCollected(0);
    setScore(0);
    setCurrentPhoneme(0);
    setGameComplete(false);
    setAudioLevel(0);
    setNasalDetected(false);
    stopListening();
  };

  const getCurrentPhoneme = () => targetPhonemes[currentPhoneme % targetPhonemes.length];

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            🐌 Sniff Snail Adventure
          </h1>
          <p className="text-gray-600">
            Help the snail smell flowers by making nasal sounds!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Nasal Sound Detection</span>
              <span className="text-sm font-normal">
                Score: {score} | Flowers: {flowersCollected}/{flowersNeeded}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Sound Level</span>
                <span className={`text-sm font-bold ${nasalDetected ? 'text-green-600' : 'text-gray-400'}`}>
                  {nasalDetected ? '👃 Nasal!' : '👂 Listen...'}
                </span>
              </div>
              <Progress value={audioLevel} className="h-4" />
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 mb-2">
                Current Sound: /{getCurrentPhoneme()}/
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPhoneme(prev => (prev + 1) % targetPhonemes.length)}
                disabled={!isListening}
              >
                <Wind className="w-4 h-4 mr-2" />
                Next Sound
              </Button>
            </div>
            
            <p className="text-sm text-center text-gray-600 mt-4">
              {nasalDetected ? '🐌 Snail is moving!' : 
               audioLevel > 20 ? '👃 Try nasal sounds (M, N)!' : 
               '🔇 Make some sound!'}
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
              gameComplete ? '🎉 All flowers collected!' :
              isListening ? `Say "/${getCurrentPhoneme()}/" to help snail smell flowers!` :
              'Press start to help the snail!'
            }
          />
        </div>

        {/* Garden Path */}
        <Card className="mb-6 bg-gradient-to-r from-green-100 to-green-200">
          <CardContent className="p-8">
            <div className="relative h-32 bg-green-200 rounded-lg overflow-hidden">
              {/* Garden path */}
              <div className="absolute bottom-4 left-0 w-full h-8 bg-yellow-600 rounded" 
                   style={{
                     background: 'repeating-linear-gradient(90deg, #d97706, #d97706 10px, #f59e0b 10px, #f59e0b 20px)'
                   }}
              />
              
              {/* Flowers */}
              {flowerPositions.map((pos, index) => (
                <div 
                  key={index}
                  className={`absolute bottom-12 transition-all duration-500 ${
                    snailPosition >= pos - 5 ? 'scale-75 opacity-50' : 'scale-100 opacity-100'
                  }`}
                  style={{ left: `${pos}%` }}
                >
                  <div className="text-4xl">
                    {index < flowersCollected ? '✅' : '🌸'}
                  </div>
                </div>
              ))}
              
              {/* Snail */}
              <div 
                className="absolute bottom-6 transition-all duration-1000 ease-out"
                style={{ left: `${Math.min(snailPosition, 95)}%` }}
              >
                <div className={`text-4xl transform ${nasalDetected ? 'animate-bounce' : ''}`}>
                  🐌
                </div>
                {nasalDetected && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="text-2xl animate-pulse">👃</div>
                  </div>
                )}
              </div>
              
              {/* Progress line */}
              <div className="absolute top-2 left-0 w-full h-2 bg-gray-300 rounded">
                <div 
                  className="h-full bg-green-500 rounded transition-all duration-1000"
                  style={{ width: `${snailPosition}%` }}
                />
              </div>
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-600">
              Distance: {snailPosition.toFixed(1)}% | Flowers collected: {flowersCollected}/{flowersNeeded}
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!gameComplete ? (
            <>
              {!isListening ? (
                <Button onClick={startListening} className="bg-green-500 hover:bg-green-600">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Start Sniffing
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
                <h3 className="text-xl font-bold text-green-800">Garden Complete!</h3>
                <p className="text-green-700">
                  Snail collected all {flowersCollected} flowers! Score: {score} points
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Garden
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

export default SniffSnailGame;