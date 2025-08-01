import React, { useState, useEffect, useRef, useCallback } from 'react';
import { scoreSpeech } from '@/utils/speechRecognition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Puzzle } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

interface WordPuzzlesGameProps {
  targetWords?: { word: string; image: string }[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const WordPuzzlesGame: React.FC<WordPuzzlesGameProps> = ({ 
  targetWords = [
    { word: 'cat', image: '🐱' },
    { word: 'dog', image: '🐶' },
    { word: 'fox', image: '🦊' },
    { word: 'pig', image: '🐷' },
    { word: 'hen', image: '🐔' }
  ],
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [puzzlesSolved, setPuzzlesSolved] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [wordAttempted, setWordAttempted] = useState(false);
  const [showCorrect, setShowCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastAttemptTime = useRef(0);
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
    setWordAttempted(false);
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
      
      // Detect word attempt
      const attempted = level > 25;
      setWordAttempted(attempted);

      // Process word attempt
      if (attempted && Date.now() - lastAttemptTime.current > 2000) {
        processWordAttempt();
        lastAttemptTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const processWordAttempt = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setAttempts(prev => prev + 1);
    try {
      const audioBlob = await recordAudioSample();
      const word = getCurrentPuzzle().word;
      const result = await scoreSpeech(audioBlob, word, 'word');
      if (result.similarityScore >= 75) {
        solvePuzzle();
      } else {
        setShowCorrect(false);
        setTimeout(() => setShowCorrect(true), 500);
      }
    } catch (err) {
      console.error('Word attempt failed', err);
    } finally {
      isCheckingRef.current = false;
    }
  };

  const solvePuzzle = () => {
    setShowCorrect(true);
    
    const newPuzzlesSolved = puzzlesSolved + 1;
    const newScore = score + (attempts <= 2 ? 60 : attempts <= 4 ? 40 : 20); // Bonus for fewer attempts
    
    setPuzzlesSolved(newPuzzlesSolved);
    setScore(newScore);
    setAttempts(0);

    setTimeout(() => {
      if (newPuzzlesSolved >= targetWords.length) {
        setGameComplete(true);
        stopListening();
        onComplete?.(newScore);
      } else {
        setCurrentPuzzle(prev => prev + 1);
        setShowCorrect(false);
      }
    }, 2000);
  };

  const resetGame = () => {
    setCurrentPuzzle(0);
    setPuzzlesSolved(0);
    setScore(0);
    setAttempts(0);
    setGameComplete(false);
    setAudioLevel(0);
    setWordAttempted(false);
    setShowCorrect(false);
    stopListening();
  };

  const getCurrentPuzzle = () => targetWords[currentPuzzle];
  
  const scrambleWord = (word: string) => {
    if (showCorrect) return word;
    const letters = word.split('');
    // Simple scramble: reverse + shuffle middle
    if (letters.length > 2) {
      const middle = letters.slice(1, -1);
      for (let i = middle.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [middle[i], middle[j]] = [middle[j], middle[i]];
      }
      return letters[0] + middle.join('') + letters[letters.length - 1];
    }
    return letters.reverse().join('');
  };

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">
            🧩 Word Puzzles
          </h1>
          <p className="text-gray-600">
            Look at the picture and say the correct word!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Puzzle Progress</span>
              <span className="text-sm font-normal">
                Score: {score} | Solved: {puzzlesSolved}/{targetWords.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={(puzzlesSolved / targetWords.length) * 100} className="h-6" />
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voice Level</span>
                <span className={`text-sm font-bold ${wordAttempted ? 'text-green-600' : 'text-gray-400'}`}>
                  {wordAttempted ? '🎤 Speaking!' : '👂 Listening...'}
                </span>
              </div>
              <Progress value={audioLevel} className="h-4" />
            </div>
            
            <p className="text-sm text-center text-gray-600">
              Attempts on this puzzle: {attempts}
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
            mood={gameComplete ? 'celebrating' : showCorrect ? 'celebrating' : 'encouraging'}
            message={
              gameComplete ? '🎉 All puzzles solved!' :
              showCorrect ? '✅ Correct! Well done!' :
              isListening ? `What do you see in the picture?` :
              'Press start to begin solving puzzles!'
            }
          />
        </div>

        {/* Puzzle Area */}
        {!gameComplete && (
          <Card className="mb-6 bg-gradient-to-b from-yellow-100 to-orange-100">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-purple-800 mb-4">
                  Puzzle {currentPuzzle + 1} of {targetWords.length}
                </h2>
                
                {/* Picture */}
                <div className="text-8xl mb-6">
                  {getCurrentPuzzle().image}
                </div>
                
                {/* Scrambled word */}
                <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
                  <div className="text-3xl font-bold text-gray-700 tracking-widest">
                    {showCorrect ? (
                      <span className="text-green-600 animate-pulse">
                        {getCurrentPuzzle().word.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-purple-700">
                        {scrambleWord(getCurrentPuzzle().word).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {showCorrect ? 'Correct!' : 'Say what you see'}
                  </div>
                </div>
                
                {/* Letter boxes */}
                <div className="flex justify-center space-x-2 mb-4">
                  {getCurrentPuzzle().word.split('').map((letter, index) => (
                    <div 
                      key={index}
                      className={`w-12 h-12 border-2 rounded flex items-center justify-center text-xl font-bold transition-all duration-500 ${
                        showCorrect 
                          ? 'border-green-500 bg-green-100 text-green-700' 
                          : 'border-purple-300 bg-white text-purple-600'
                      }`}
                    >
                      {showCorrect ? letter.toUpperCase() : '?'}
                    </div>
                  ))}
                </div>
                
                {showCorrect && (
                  <div className="text-green-600 text-xl font-bold animate-bounce">
                    ✅ Well done! Moving to next puzzle...
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
                  Start Solving
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive">
                  Stop Listening
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={() => {
                  setShowCorrect(true);
                  setTimeout(() => {
                    solvePuzzle();
                  }, 1000);
                }}
                disabled={showCorrect}
              >
                <Puzzle className="w-4 h-4 mr-2" />
                Show Answer
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-800">All Puzzles Solved!</h3>
                <p className="text-green-700">
                  You solved {puzzlesSolved} puzzles! Final Score: {score} points
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Puzzles
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

export default WordPuzzlesGame;