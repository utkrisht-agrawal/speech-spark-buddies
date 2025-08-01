import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Zap } from 'lucide-react';
import { scoreSpeech } from '@/utils/speechRecognition';

interface PhonemeRaceGameProps {
  targetPhonemes?: string[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const PhonemeRaceGame: React.FC<PhonemeRaceGameProps> = ({
  targetPhonemes = ['r'],
  onComplete,
  onBack
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPhoneme, setCurrentPhoneme] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [raceStarted, setRaceStarted] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const raceLength = 100; // Race progress from 0 to 100

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
      setRaceStarted(true);
      startTimer();
      
      // Record for 1 second for phonemes
      setTimeout(() => {
        if (recorder && recorder.state === 'recording') {
          recorder.stop();
        }
      }, 1000);
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
        advancePlayer();
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

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };


  const advancePlayer = () => {
    const advancement = (Math.random() * 3 + 2) * 1.2; // Random advancement 2-5%, boosted by 20%
    const newPosition = Math.min(playerPosition + advancement, raceLength);
    setPlayerPosition(newPosition);
    
    const newScore = score + Math.floor(advancement * 10);
    setScore(newScore);

    if (newPosition >= raceLength) {
      endGame(true);
    }
  };

  const endGame = (won = false) => {
    setGameComplete(true);
    setRaceStarted(false);
    stopRecording();
    
    if (won) {
      onComplete?.(score + timeLeft * 10); // Bonus for time remaining
    } else {
      onComplete?.(score);
    }
  };

  const resetGame = () => {
    setPlayerPosition(0);
    setScore(0);
    setCurrentPhoneme(0);
    setTimeLeft(60);
    setGameComplete(false);
    setRaceStarted(false);
    
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">
            🏁 Phoneme Race
          </h1>
          <p className="text-gray-600">
            Say phoneme sounds as fast as you can to win the race!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Race Progress</span>
              <span className="text-sm font-normal">
                Score: {score} | Time: {timeLeft}s
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Position</span>
                <span className="text-sm">{playerPosition.toFixed(1)}%</span>
              </div>
              <Progress value={playerPosition} className="h-6" />
            </div>
            
            
            <div className="text-center">
              <p className="text-lg text-orange-700">
                Current phoneme: /{getCurrentPhoneme()}/
              </p>
              <p className="text-sm text-orange-600 mt-2">
                Say: "<span className="font-bold text-orange-800">{getCurrentPhoneme()}</span>"
              </p>
            </div>
            {microphoneError && (
              <p className="text-sm text-center text-red-600 mt-2">
                {microphoneError}
              </p>
            )}
          </CardContent>
        </Card>


        {/* Race Track */}
        <Card className="mb-6 bg-gradient-to-r from-green-100 via-yellow-100 to-red-100">
          <CardContent className="p-8">
            <div className="relative h-24 bg-gray-200 rounded-lg overflow-hidden">
              {/* Race track lanes */}
              <div className="absolute top-0 left-0 w-full h-full">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute border-b border-white"
                    style={{ top: `${i * 20}%`, width: '100%', height: '20%' }}
                  />
                ))}
              </div>
              
              {/* Finish line */}
              <div className="absolute top-0 right-4 w-2 h-full bg-gradient-to-b from-black via-white to-black" />
              
              {/* Player */}
              <div
                className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300"
                style={{ left: `${Math.min(playerPosition, 95)}%` }}
              >
                <div
                  className="text-3xl"
                  style={{ transform: 'scaleX(-1)' }}
                >
                  🏃‍♂️
                </div>
              </div>
              
              {/* Distance markers */}
              {[25, 50, 75].map(distance => (
                <div 
                  key={distance}
                  className="absolute top-0 h-full w-0.5 bg-gray-400"
                  style={{ left: `${distance}%` }}
                >
                  <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold">
                    {distance}%
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-orange-800">
                Current Phoneme: /{getCurrentPhoneme()}/
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPhoneme(prev => (prev + 1) % targetPhonemes.length)}
                className="mt-2"
                disabled={!raceStarted}
              >
                <Zap className="w-4 h-4 mr-2" />
                Next Phoneme
              </Button>
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
                <h3 className="text-xl font-bold text-green-800">
                  {playerPosition >= raceLength ? 'Race Won!' : 'Race Complete!'}
                </h3>
                <p className="text-green-700">
                  Final Score: {score} points | Distance: {playerPosition.toFixed(1)}%
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Race Again
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

export default PhonemeRaceGame;