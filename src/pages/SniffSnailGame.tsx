import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Wind } from 'lucide-react';
import { scoreSpeech } from '@/utils/speechRecognition';

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
  const [isRecording, setIsRecording] = useState(false);
  const [snailPosition, setSnailPosition] = useState(0);
  const [flowersCollected, setFlowersCollected] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentPhoneme, setCurrentPhoneme] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const gardenLength = 100;
  const flowersNeeded = 5;
  const flowerPositions = [20, 40, 60, 80, 100];

  const startRecording = async () => {
    try {
      setMicrophoneError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processRecordedAudio(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setIsRecording(true);
      
      // Record for 3 seconds for nasal sounds
      setTimeout(() => {
        if (recorder && recorder.state === 'recording') {
          recorder.stop();
        }
      }, 3000);
    } catch (error) {
      setMicrophoneError('Microphone access denied');
      setIsRecording(false);
    }
  };

  const processRecordedAudio = async (audioBlob: Blob) => {
    try {
      const currentPhonemeValue = getCurrentPhoneme();
      if (!currentPhonemeValue) return;
      
      const result = await scoreSpeech(audioBlob, currentPhonemeValue, 'phoneme');
      
      if (result.similarityScore >= 80 || result.visemeScore >= 80) {
        moveSnail();
      } else {
        setMicrophoneError(`Say "${currentPhonemeValue}" - Score: ${Math.round(result.similarityScore)}%`);
        setTimeout(() => setMicrophoneError(null), 2000);
      }
    } catch (error) {
      console.error('Speech scoring failed:', error);
      setMicrophoneError('Speech recognition failed. Try again!');
      setTimeout(() => setMicrophoneError(null), 2000);
    }
  };

  const moveSnail = () => {
    const movement = 5 + Math.random() * 5; // Move 5-10 units
    const newPosition = Math.min(snailPosition + movement, gardenLength);
    setSnailPosition(newPosition);
    
    // Check for flower collection - collect flowers that haven't been collected yet
    // and are within range of the snail's new position
    const uncollectedFlowers = flowerPositions.slice(flowersCollected);
    const nearbyFlower = uncollectedFlowers.find(pos => 
      newPosition >= pos - 3 && newPosition <= pos + 3
    );
    
    if (nearbyFlower) {
      const newFlowersCollected = flowersCollected + 1;
      const newScore = score + 50;
      setFlowersCollected(newFlowersCollected);
      setScore(newScore);
      
      if (newFlowersCollected >= flowersNeeded) {
        setGameComplete(true);
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
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const getCurrentPhoneme = () => targetPhonemes[currentPhoneme % targetPhonemes.length];

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 mb-2">
                Current Sound: /{getCurrentPhoneme()}/
              </div>
              <p className="text-sm text-green-600 mt-2">
                Say: "<span className="font-bold text-green-800">{getCurrentPhoneme()}</span>"
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPhoneme(prev => (prev + 1) % targetPhonemes.length)}
                disabled={isRecording}
                className="mt-2"
              >
                <Wind className="w-4 h-4 mr-2" />
                Next Sound
              </Button>
            </div>
            {microphoneError && (
              <p className="text-sm text-center text-red-600 mt-2">
                {microphoneError}
              </p>
            )}
          </CardContent>
        </Card>


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
                    {flowersCollected > index ? '✅' : '🌸'}
                  </div>
                </div>
              ))}
              
              {/* Snail */}
              <div 
                className="absolute bottom-6 transition-all duration-1000 ease-out"
                style={{ left: `${Math.min(snailPosition, 95)}%` }}
              >
                <div className="text-4xl transform">
                  🐌
                </div>
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
              {!isRecording ? (
                <Button onClick={startRecording} className="bg-green-500 hover:bg-green-600">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <Button disabled className="bg-gray-400 text-white">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Recording...
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