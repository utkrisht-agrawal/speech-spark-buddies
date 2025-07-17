import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Eye } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

interface GuessTheObjectGameProps {
  targetObjects?: { name: string; emoji: string; hints: string[] }[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const GuessTheObjectGame: React.FC<GuessTheObjectGameProps> = ({ 
  targetObjects = [
    { name: 'apple', emoji: '🍎', hints: ['red', 'round', 'fruit'] },
    { name: 'car', emoji: '🚗', hints: ['vehicle', 'wheels', 'drive'] },
    { name: 'book', emoji: '📚', hints: ['pages', 'read', 'words'] },
    { name: 'tree', emoji: '🌳', hints: ['green', 'tall', 'leaves'] },
    { name: 'house', emoji: '🏠', hints: ['home', 'roof', 'door'] }
  ],
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentObject, setCurrentObject] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [guessAttempted, setGuessAttempted] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [objectsGuessed, setObjectsGuessed] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastGuessTime = useRef(0);

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
    setGuessAttempted(false);
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
      
      const attempted = level > 30;
      setGuessAttempted(attempted);

      if (attempted && Date.now() - lastGuessTime.current > 2000) {
        processGuess();
        lastGuessTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const processGuess = () => {
    // Simulate guess recognition
    const success = Math.random() > 0.4; // 60% success rate
    
    if (success) {
      correctGuess();
    } else {
      wrongGuess();
    }
  };

  const correctGuess = () => {
    setShowAnswer(true);
    const newScore = score + (50 - hintIndex * 10); // Less points for more hints
    setScore(newScore);
    const newObjectsGuessed = objectsGuessed + 1;
    setObjectsGuessed(newObjectsGuessed);

    setTimeout(() => {
      if (newObjectsGuessed >= targetObjects.length) {
        setGameComplete(true);
        stopListening();
        onComplete?.(newScore);
      } else {
        nextObject();
      }
    }, 2000);
  };

  const wrongGuess = () => {
    if (hintIndex < targetObjects[currentObject].hints.length - 1) {
      setHintIndex(prev => prev + 1);
    } else {
      setShowAnswer(true);
      setTimeout(() => nextObject(), 2000);
    }
  };

  const nextObject = () => {
    setCurrentObject(prev => prev + 1);
    setHintIndex(0);
    setShowAnswer(false);
  };

  const resetGame = () => {
    setCurrentObject(0);
    setHintIndex(0);
    setScore(0);
    setObjectsGuessed(0);
    setGameComplete(false);
    setAudioLevel(0);
    setGuessAttempted(false);
    setShowAnswer(false);
    stopListening();
  };

  const getCurrentObject = () => targetObjects[currentObject];

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">
            🔍 Guess the Object
          </h1>
          <p className="text-gray-600">
            Listen to the hints and guess what object it is!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Guessing Progress</span>
              <span className="text-sm font-normal">
                Score: {score} | Objects: {objectsGuessed}/{targetObjects.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={(objectsGuessed / targetObjects.length) * 100} className="h-6" />
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voice Level</span>
                <span className={`text-sm font-bold ${guessAttempted ? 'text-green-600' : 'text-gray-400'}`}>
                  {guessAttempted ? '🎤 Guessing!' : '👂 Listening...'}
                </span>
              </div>
              <Progress value={audioLevel} className="h-4" />
            </div>
            
            <p className="text-sm text-center text-gray-600">
              Hint {hintIndex + 1} of {getCurrentObject()?.hints.length}
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
            mood={gameComplete ? 'celebrating' : showAnswer ? 'celebrating' : 'encouraging'}
            message={
              gameComplete ? '🎉 All objects guessed!' :
              showAnswer ? `✅ Correct! It's ${getCurrentObject()?.name}!` :
              isListening ? `Think about what this could be...` :
              'Press start to begin guessing!'
            }
          />
        </div>

        {/* Game Area */}
        {!gameComplete && (
          <Card className="mb-6 bg-gradient-to-b from-blue-100 to-purple-100">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-indigo-800 mb-4">
                  Object {currentObject + 1}
                </h2>
                
                {/* Object (hidden until answer) */}
                <div className="text-8xl mb-6">
                  {showAnswer ? getCurrentObject()?.emoji : '❓'}
                </div>
                
                {/* Hints */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                  <h3 className="text-lg font-bold text-indigo-700 mb-4">Hints:</h3>
                  {getCurrentObject()?.hints.slice(0, hintIndex + 1).map((hint, index) => (
                    <div 
                      key={index}
                      className="text-xl text-gray-700 mb-2 p-2 bg-yellow-100 rounded animate-fade-in"
                    >
                      💡 It is {hint}
                    </div>
                  ))}
                </div>
                
                {showAnswer && (
                  <div className="text-green-600 text-2xl font-bold animate-bounce">
                    ✅ It's a {getCurrentObject()?.name}!
                  </div>
                )}
                
                {!showAnswer && (
                  <div className="text-indigo-600 text-xl font-bold">
                    What am I?
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!gameComplete ? (
            <>
              {!isListening ? (
                <Button onClick={startListening} className="bg-green-500 hover:bg-green-600">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Start Guessing
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive">
                  Stop Listening
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={() => {
                  setShowAnswer(true);
                  setTimeout(() => nextObject(), 1000);
                }}
                disabled={showAnswer}
              >
                <Eye className="w-4 h-4 mr-2" />
                Show Answer
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-800">All Objects Guessed!</h3>
                <p className="text-green-700">
                  You guessed {objectsGuessed} objects! Final Score: {score} points
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Objects
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

export default GuessTheObjectGame;