import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

interface FeedTheMonsterGameProps {
  targetPhoneme?: string;
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const FeedTheMonsterGame: React.FC<FeedTheMonsterGameProps> = ({ 
  targetPhoneme = 'p',
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [monsterHunger, setMonsterHunger] = useState(100);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [feedCount, setFeedCount] = useState(0);
  const [monsterMood, setMonsterMood] = useState<'hungry' | 'eating' | 'happy' | 'full'>('hungry');
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFeedTime = useRef(0);

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

      // Feed monster if sound is strong enough
      if (level > 50 && Date.now() - lastFeedTime.current > 1000 && monsterHunger > 0) {
        feedMonster();
        lastFeedTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const feedMonster = () => {
    setMonsterMood('eating');
    const newHunger = Math.max(0, monsterHunger - 20);
    const newScore = score + 30;
    const newFeedCount = feedCount + 1;
    
    setMonsterHunger(newHunger);
    setScore(newScore);
    setFeedCount(newFeedCount);

    setTimeout(() => {
      if (newHunger === 0) {
        setMonsterMood('full');
        setGameComplete(true);
        stopListening();
        onComplete?.(newScore);
      } else {
        setMonsterMood(newHunger < 40 ? 'happy' : 'hungry');
      }
    }, 1000);
  };

  const resetGame = () => {
    setMonsterHunger(100);
    setScore(0);
    setFeedCount(0);
    setGameComplete(false);
    setMonsterMood('hungry');
    setAudioLevel(0);
    stopListening();
  };

  const getMonsterEmoji = () => {
    switch (monsterMood) {
      case 'hungry': return '😋';
      case 'eating': return '😋🍎';
      case 'happy': return '😊';
      case 'full': return '😴';
      default: return '😋';
    }
  };

  const getMonsterColor = () => {
    switch (monsterMood) {
      case 'hungry': return 'text-red-500';
      case 'eating': return 'text-orange-500';
      case 'happy': return 'text-green-500';
      case 'full': return 'text-blue-500';
      default: return 'text-red-500';
    }
  };

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            👹 Feed the Monster
          </h1>
          <p className="text-gray-600">
            Say "/{targetPhoneme}/" sound to feed the hungry monster!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sound Level</span>
              <span className="text-sm font-normal">
                Score: {score} | Fed: {feedCount}/5
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={audioLevel} className="h-4 mb-4" />
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monster Hunger</span>
                <span className="text-sm">{monsterHunger}%</span>
              </div>
              <Progress value={monsterHunger} className="h-3" />
            </div>
            <p className="text-sm text-center text-gray-600">
              {audioLevel > 50 ? '🍎 Feeding the monster!' : 
               audioLevel > 25 ? '📢 Good, speak louder!' : 
               '🔇 Monster is waiting for food!'}
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
              gameComplete ? '🎉 Monster is full and happy!' :
              isListening ? `Say "/${targetPhoneme}/" to feed the monster!` :
              'Press start to feed the hungry monster!'
            }
          />
        </div>

        {/* Monster Display */}
        <Card className="mb-6 bg-gradient-to-b from-purple-100 to-pink-100">
          <CardContent className="p-8 text-center">
            <div className="relative">
              <div className={`text-9xl transition-all duration-500 ${getMonsterColor()} ${
                monsterMood === 'eating' ? 'animate-bounce' : ''
              }`}>
                {getMonsterEmoji()}
              </div>
              
              {audioLevel > 30 && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
                  <div className="text-4xl animate-bounce">🍎</div>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-purple-800">
                  {monsterMood === 'hungry' && 'I\'m so hungry!'}
                  {monsterMood === 'eating' && 'Yummy! More please!'}
                  {monsterMood === 'happy' && 'Thank you! I feel better!'}
                  {monsterMood === 'full' && 'I\'m full! ZZZ...'}
                </h3>
              </div>
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
                  Start Feeding
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
                <h3 className="text-xl font-bold text-green-800">Monster is Full!</h3>
                <p className="text-green-700">You scored {score} points by feeding the monster {feedCount} times!</p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Feed Again
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

export default FeedTheMonsterGame;