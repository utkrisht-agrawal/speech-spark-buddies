import React, { useState, useEffect, useRef } from 'react';
import { scoreSpeech, AdvancedSpeechRecognition } from '@/utils/speechRecognition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, MessageCircle } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

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
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [sentencesCompleted, setSentencesCompleted] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const recognitionRef = useRef(new AdvancedSpeechRecognition());
  const isCheckingRef = useRef(false);

  const getCurrentBubbleWord = () => {
    const available = bubbles.find(b => !b.popped);
    return available ? available.word : '';
  };

  const recordAudioSample = async (duration = 1500): Promise<Blob> => {
    await recognitionRef.current.startRecording();
    await new Promise(res => setTimeout(res, duration));
    return recognitionRef.current.stopRecording();
  };

  const checkForWord = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      setIsRecording(true);
      const audioBlob = await recordAudioSample();
      setIsRecording(false);
      const bubbleWord = getCurrentBubbleWord();
      const result = await scoreSpeech(audioBlob, bubbleWord, 'word');
      if (result.similarityScore >= 75) {
        popBubble();
      }
    } catch (err) {
      console.error('Bubble word check failed', err);
    } finally {
      isCheckingRef.current = false;
    }
  };

  useEffect(() => {
    createBubbles();
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

  const handleRecord = async () => {
    setMicrophoneError(null);
    await checkForWord();
  };

  const popBubble = () => {
    const availableBubbles = bubbles.filter(b => !b.popped);
    if (availableBubbles.length === 0) return;

    const bubbleToPop = availableBubbles[0];
    setBubbles(prev => prev.map(b => 
      b.id === bubbleToPop.id ? { ...b, popped: true } : b
    ));

    const newScore = score + 30;
    setScore(newScore);

    if (availableBubbles.length === 1) {
      // All bubbles popped
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
    }
  };

  const resetGame = () => {
    setCurrentSentence(0);
    setScore(0);
    setSentencesCompleted(0);
    setGameComplete(false);
    createBubbles();
  };

  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
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

            <p className="text-sm text-center text-gray-600">
              {isRecording ? '🫧 Recording...' : '🎤 Press start and speak'}
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
            isListening={isRecording}
            mood={gameComplete ? 'celebrating' : 'encouraging'}
            message={
              gameComplete ? '🎉 All sentences spoken!' :
              isRecording ? `Say: "${targetSentences[currentSentence]}"` :
              'Press start to begin popping bubbles!'
            }
          />
        </div>

        {/* Bubble Area */}
        {!gameComplete && (
          <Card className="mb-6 bg-gradient-to-b from-blue-100 to-cyan-100">
            <CardContent className="p-8 relative h-80">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-cyan-800">
                  Sentence {currentSentence + 1}: "{targetSentences[currentSentence]}"
                </h3>
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
                      <div className="w-20 h-20 bg-gradient-to-br from-cyan-200 to-blue-300 rounded-full border-2 border-cyan-400 shadow-lg flex items-center justify-center">
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
            <Button onClick={handleRecord} className="bg-green-500 hover:bg-green-600" disabled={isRecording}>
              <Volume2 className="w-4 h-4 mr-2" />
              {isRecording ? 'Recording...' : 'Start Speaking'}
            </Button>
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