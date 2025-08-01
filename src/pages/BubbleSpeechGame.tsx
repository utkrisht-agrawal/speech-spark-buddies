import React, { useState, useEffect, useRef, useCallback } from 'react';
import { scoreSpeech } from '@/utils/speechRecognition';
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
  const [isListening, setIsListening] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [bubbles, setBubbles] = useState<{id: number, word: string, popped: boolean, x: number, y: number}[]>([]);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [sentencesCompleted, setSentencesCompleted] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpeechTime = useRef(0);
  const isCheckingRef = useRef(false);

  const getCurrentBubbleWord = () => {
    const available = bubbles.find(b => !b.popped);
    return available ? available.word : '';
  };

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

  const checkForWord = async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    try {
      const audioBlob = await recordAudioSample();
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
    setSpeechDetected(false);
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
      
      const detected = level > 30;
      setSpeechDetected(detected);

      if (detected && Date.now() - lastSpeechTime.current > 1000) {
        checkForWord();
        lastSpeechTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
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
          stopListening();
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
    setAudioLevel(0);
    setSpeechDetected(false);
    createBubbles();
    stopListening();
  };

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

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
            
            <div className="mb-4">
              <Progress value={audioLevel} className="h-4" />
            </div>
            
            <p className="text-sm text-center text-gray-600">
              {speechDetected ? '🫧 Popping bubbles!' : '🎤 Speak to pop bubbles!'}
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
              gameComplete ? '🎉 All sentences spoken!' :
              isListening ? `Say: "${targetSentences[currentSentence]}"` :
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
            <>
              {!isListening ? (
                <Button onClick={startListening} className="bg-green-500 hover:bg-green-600">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Start Speaking
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