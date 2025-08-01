import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, MessageCircle } from 'lucide-react';
import { scoreSpeech } from '@/utils/speechRecognition';

interface BubbleSpeechGameProps {
  targetSentences?: string[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const BubbleSpeechGame: React.FC<BubbleSpeechGameProps> = ({ 
  targetSentences = [
    'I eat apple',
    'She jumps high', 
    'We like mango',
    'He reads books',
    'They play games'
  ],
  onComplete,
  onBack 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [bubbles, setBubbles] = useState<{id: number, word: string, popped: boolean, x: number, y: number}[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [sentencesCompleted, setSentencesCompleted] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    createBubbles();
    setCurrentWordIndex(0);
  }, [currentSentence]);

  const createBubbles = () => {
    const words = targetSentences[currentSentence].split(' ');
    const newBubbles = words.map((word, index) => ({
      id: index,
      word,
      popped: false,
      x: Math.random() * 70 + 10,
      y: Math.random() * 60 + 20
    }));
    setBubbles(newBubbles);
  };

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
      
      // Record for 3 seconds
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
      const currentWord = bubbles[currentWordIndex]?.word;
      if (!currentWord) return;
      
      const result = await scoreSpeech(audioBlob, currentWord, 'word');
      
      if (result.similarityScore >= 90) {
        popCurrentBubble();
      } else {
        setMicrophoneError(`Say "${currentWord}" - Score: ${Math.round(result.similarityScore)}%`);
        setTimeout(() => setMicrophoneError(null), 2000);
      }
    } catch (error) {
      console.error('Speech scoring failed:', error);
      setMicrophoneError('Speech recognition failed. Try again!');
      setTimeout(() => setMicrophoneError(null), 2000);
    }
  };

  const popCurrentBubble = () => {
    // Pop the current word bubble
    setBubbles(prev => prev.map(b => 
      b.id === currentWordIndex ? { ...b, popped: true } : b
    ));

    const newScore = score + 30;
    setScore(newScore);

    // Move to next word
    const nextWordIndex = currentWordIndex + 1;
    
    if (nextWordIndex >= bubbles.length) {
      // All words in sentence completed
      const newCompleted = sentencesCompleted + 1;
      setSentencesCompleted(newCompleted);
      
      setTimeout(() => {
        if (newCompleted >= targetSentences.length) {
          setGameComplete(true);
          onComplete?.(newScore);
        } else {
          setCurrentSentence(prev => prev + 1);
        }
      }, 1500);
    } else {
      // Move to next word
      setCurrentWordIndex(nextWordIndex);
    }
  };

  const resetGame = () => {
    setCurrentSentence(0);
    setCurrentWordIndex(0);
    setScore(0);
    setSentencesCompleted(0);
    setGameComplete(false);
    createBubbles();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-800 mb-2">
            🫧 Bubble Speech
          </h1>
          <p className="text-gray-600">
            Speak to pop the word bubbles in order!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Speech Bubbles</span>
              <span className="text-sm font-normal">
                Score: {score} | Sentences: {sentencesCompleted}/{targetSentences.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={(sentencesCompleted / targetSentences.length) * 100} className="h-6" />
            </div>
            
            {microphoneError && (
              <p className="text-sm text-center text-red-600 mt-2">
                {microphoneError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bubble Area */}
        {!gameComplete && (
          <Card className="mb-6 bg-gradient-to-b from-blue-100 to-cyan-100">
            <CardContent className="p-8 relative h-80">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-cyan-800">
                  Sentence {currentSentence + 1}: "{targetSentences[currentSentence]}"
                </h3>
                <p className="text-sm text-cyan-600 mt-2">
                  Say: "<span className="font-bold text-cyan-800">{bubbles[currentWordIndex]?.word}</span>"
                </p>
              </div>
              
              <div className="relative h-64 overflow-hidden">
                {bubbles.map((bubble) => (
                  <div
                    key={bubble.id}
                    className={`absolute transition-all duration-500 ${
                      bubble.popped ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                    }`}
                    style={{
                      left: `${bubble.x}%`,
                      top: `${bubble.y}%`,
                      animation: bubble.popped ? 'none' : 'float 3s ease-in-out infinite'
                    }}
                  >
                     <div className="relative">
                       <div className={`w-20 h-20 rounded-full border-2 shadow-lg flex items-center justify-center transition-all duration-300 ${
                         bubble.id === currentWordIndex && !bubble.popped
                           ? 'bg-gradient-to-br from-yellow-200 to-orange-300 border-yellow-400 scale-110' 
                           : 'bg-gradient-to-br from-cyan-200 to-blue-300 border-cyan-400'
                       }`}>
                         <span className="text-sm font-bold text-cyan-800">
                           {bubble.word}
                         </span>
                       </div>
                       <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white rounded-full opacity-60" />
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                <h3 className="text-xl font-bold text-green-800">All Bubbles Popped!</h3>
                <p className="text-green-700">Score: {score} points</p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Bubbles
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
        
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default BubbleSpeechGame;