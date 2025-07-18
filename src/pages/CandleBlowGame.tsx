
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Wind, RotateCcw, Trophy, Target } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';
import { CameraWindow } from '@/components/CameraWindow';

interface CandleBlowGameProps {
  targetPhoneme?: string;
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const CandleBlowGame: React.FC<CandleBlowGameProps> = ({ 
  targetPhoneme = 'p',
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [blowStrength, setBlowStrength] = useState(0);
  const [candlesLit, setCandlesLit] = useState([true, true, true, true, true]);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentCandle, setCurrentCandle] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Use refs to avoid stale closure issues
  const currentCandleRef = useRef(currentCandle);
  const candlesLitRef = useRef(candlesLit);
  const lastExtinguishTime = useRef(0);
  
  // Update refs when state changes
  useEffect(() => {
    currentCandleRef.current = currentCandle;
    candlesLitRef.current = candlesLit;
  }, [currentCandle, candlesLit]);

  const maxAttempts = 10;
  const totalCandles = candlesLit.length;

  const stopListening = useCallback(() => {
    console.log('🛑 stopListening called');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log('Cancelled animation frame');
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped audio track');
      });
      streamRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
      console.log('Closed audio context');
    }
    
    setIsListening(false);
    setBlowStrength(0);
    console.log('🛑 Audio monitoring stopped');
  }, []);

  useEffect(() => {
    // Only cleanup on unmount, not on re-renders
    return () => {
      console.log('Component unmounting, cleaning up...');
      stopListening();
    };
  }, [stopListening]);

  const startListening = async () => {
    try {
      setMicrophoneError(null);
      console.log('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      streamRef.current = stream;
      console.log('Microphone access granted');

      // Create audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      // Configure analyser for better breath detection
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;

      microphoneRef.current.connect(analyserRef.current);

      setIsListening(true);
      monitorAudioLevel();
      console.log('Audio monitoring started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setMicrophoneError('Microphone access denied or not available');
      setIsListening(false);
    }
  };


  const monitorAudioLevel = () => {
    if (!analyserRef.current) {
      console.log('❌ No analyser available');
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    console.log('📊 Starting audio level monitoring, buffer length:', bufferLength);

    const checkLevel = () => {
      // Check if we still have the necessary objects (don't rely on state)
      if (!analyserRef.current || !streamRef.current) {
        console.log('❌ Analyser or stream lost, stopping monitoring');
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Check overall audio level first
      let totalSum = 0;
      for (let i = 0; i < bufferLength; i++) {
        totalSum += dataArray[i];
      }
      const overallAverage = totalSum / bufferLength;
      
      // Focus on lower frequencies for breath detection (0-500Hz range)
      const breathRange = Math.floor(bufferLength * 0.1);
      let sum = 0;
      for (let i = 0; i < breathRange; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / breathRange;
      const strength = Math.min((average / 30) * 100, 100);
      
      // Only log when there's actual audio input
      if (overallAverage > 0.1 || average > 0.1) {
        console.log('🎵 Overall audio:', overallAverage.toFixed(1), 'Breath range:', average.toFixed(1), 'Strength:', strength.toFixed(1));
      }
      
      setBlowStrength(strength);

      // Check if blow is strong enough to extinguish candle using refs to avoid stale closure
      const currentCandleIndex = currentCandleRef.current;
      const currentCandlesLit = candlesLitRef.current;
      const now = Date.now();
      
      if (strength > 70 && currentCandlesLit[currentCandleIndex] && (now - lastExtinguishTime.current) > 1000) {
        console.log('🎯 Strong blow detected! Strength:', strength.toFixed(1), 'Current candle:', currentCandleIndex, 'Candle lit:', currentCandlesLit[currentCandleIndex]);
        lastExtinguishTime.current = now;
        extinguishCandle();
      }

      // Continue monitoring (removed isListening check that was causing issues)
      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  };

  const extinguishCandle = () => {
    console.log('🔥 Extinguishing candle', currentCandle, 'of', totalCandles);
    const newCandlesLit = [...candlesLit];
    newCandlesLit[currentCandle] = false;
    setCandlesLit(newCandlesLit);
    
    const newScore = score + 20;
    setScore(newScore);
    
    if (currentCandle < totalCandles - 1) {
      const nextCandle = currentCandle + 1;
      console.log('🎯 Moving to next candle:', nextCandle);
      setCurrentCandle(nextCandle);
      // Reset the debounce timer for the next candle
      lastExtinguishTime.current = 0;
    } else {
      // All candles extinguished - stay in game to show completion screen
      console.log('🎉 All candles extinguished! Game complete!');
      setGameComplete(true);
      stopListening();
      // Don't call onComplete immediately - let user choose to restart or go back
    }
  };

  const handleManualBlow = () => {
    if (candlesLit[currentCandle]) {
      setAttempts(prev => prev + 1);
      // Simulate blow strength
      const strength = Math.random() * 100;
      setBlowStrength(strength);
      
      setTimeout(() => {
        if (strength > 60) {
          extinguishCandle();
        }
        setBlowStrength(0);
      }, 1000);

      if (attempts >= maxAttempts - 1 && !gameComplete) {
        setGameComplete(true);
        onComplete?.(score);
      }
    }
  };

  const resetGame = () => {
    setCandlesLit([true, true, true, true, true]);
    setScore(0);
    setAttempts(0);
    setCurrentCandle(0);
    setGameComplete(false);
    setBlowStrength(0);
    setMicrophoneError(null);
    stopListening();
  };

  const renderCandle = (index: number) => {
    const isLit = candlesLit[index];
    const isCurrent = index === currentCandle;
    const flameIntensity = isLit && isCurrent ? Math.max(0.3, 1 - (blowStrength / 100)) : (isLit ? 1 : 0);

    return (
      <div key={index} className="flex flex-col items-center relative">
        {/* Flame */}
        {isLit && (
          <div 
            className={`w-6 h-8 bg-gradient-to-t from-orange-400 to-yellow-300 rounded-full transition-all duration-300 ${
              isCurrent && blowStrength > 30 ? 'animate-pulse scale-x-75' : ''
            }`}
            style={{ 
              opacity: flameIntensity,
              transform: isCurrent ? `scaleX(${1 - (blowStrength / 200)}) scaleY(${flameIntensity})` : 'none'
            }}
          />
        )}
        
        {/* Wick */}
        <div className="w-1 h-4 bg-gray-800 relative">
          {!isLit && (
            <div className="absolute top-0 w-2 h-2 bg-gray-600 rounded-full -translate-x-0.5" />
          )}
        </div>
        
        {/* Candle body */}
        <div className={`w-8 h-16 rounded-b-lg ${
          isCurrent ? 'bg-red-400 ring-2 ring-red-300' : 'bg-red-300'
        }`} />
        
        {/* Candle base */}
        <div className="w-12 h-2 bg-gray-600 rounded-full" />
        
        {/* Target indicator */}
        {isCurrent && (
          <div className="absolute -bottom-8">
            <Target className="w-6 h-6 text-red-500 animate-bounce" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">
            🕯️ Candle Blow Practice
          </h1>
          <p className="text-gray-600">
            Practice your /{targetPhoneme}/ sound by blowing out the candles!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Blow Strength</span>
              <span className="text-sm font-normal">
                Score: {score} | Attempt: {attempts + 1}/{maxAttempts}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress 
              value={blowStrength} 
              className="h-4 mb-2"
            />
            <p className="text-sm text-center text-gray-600">
              {blowStrength > 50 ? '🌬️ Perfect blow!' : 
               blowStrength > 25 ? '💨 Good, blow harder!' : 
               '🤏 Blow stronger!'}
            </p>
            {microphoneError && (
              <p className="text-sm text-center text-red-600 mt-2">
                {microphoneError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Avatar Guide and Camera */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-4 justify-center items-start">
            <AvatarGuide
              isListening={isListening}
              mood={gameComplete ? 'celebrating' : 'encouraging'}
              message={
                gameComplete ? '🎉 Excellent work!' :
                isListening ? `Say "/${targetPhoneme}/" and blow into your microphone!` :
                'Press start to begin!'
              }
            />
            <CameraWindow 
              isActive={isListening}
              className="w-32 h-24"
            />
          </div>
        </div>

        {/* Candles */}
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex justify-center items-end space-x-8">
              {candlesLit.map((_, index) => renderCandle(index))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-6 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="font-semibold text-blue-800 mb-2">How to Play:</h3>
              <p className="text-sm text-blue-700">
                Say "/{targetPhoneme}/" sound while blowing air into your microphone to extinguish each candle. 
                The stronger your blow, the easier it is to put out the flame!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!gameComplete ? (
            <>
              {!isListening ? (
                <Button
                  onClick={startListening}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <Wind className="w-4 h-4 mr-2" />
                  Start Listening
                </Button>
              ) : (
                <Button
                  onClick={stopListening}
                  variant="destructive"
                >
                  Stop Listening
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleManualBlow}
                disabled={gameComplete}
              >
                <Wind className="w-4 h-4 mr-2" />
                Manual Blow
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-800">Congratulations!</h3>
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

export default CandleBlowGame;
