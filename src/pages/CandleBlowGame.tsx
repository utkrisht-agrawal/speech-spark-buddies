
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

  // Refs to keep latest state inside animation callbacks
  const currentCandleRef = useRef(currentCandle);
  const candlesLitRef = useRef(candlesLit);

  // Keep refs in sync with state
  useEffect(() => {
    currentCandleRef.current = currentCandle;
  }, [currentCandle]);

  useEffect(() => {
    candlesLitRef.current = candlesLit;
  }, [candlesLit]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Timing control
  const lastExtinguishTime = useRef(Date.now() + 3000); // Debounce between blows

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

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      setIsListening(true);
      // Reset debounce timer so first candle doesn't auto-extinguish
      lastExtinguishTime.current = Date.now() + 3000;
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

    const checkLevel = () => {
      if (!analyserRef.current || !streamRef.current) {
        return;
      }

      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Focus on lower frequencies for breath detection (0-500Hz range)
      const breathRange = Math.floor(bufferLength * 0.1);
      let sum = 0;
      for (let i = 0; i < breathRange; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / breathRange;
      const strength = Math.min((average / 30) * 100, 100);
      
      setBlowStrength(strength);

      // Check if blow is strong enough
      if (strength > 80) {
        const now = Date.now();
        const candleIdx = currentCandleRef.current;
        console.log('💨 Blow detected - Strength:', strength.toFixed(1), 'Current candle:', candleIdx, 'Time since last:', now - lastExtinguishTime.current);

        // Check current candle state and timing using refs to avoid stale state
        if (candlesLitRef.current[candleIdx] && (now - lastExtinguishTime.current) > 2000) {
          console.log('🎯 Extinguishing candle!');
          lastExtinguishTime.current = now;
          extinguishCandle();
        } else if (!candlesLitRef.current[candleIdx]) {
          console.log('⚠️ Current candle already extinguished');
        } else {
          console.log('⏰ Too soon since last extinguish');
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };

    // Add small delay before starting to prevent immediate trigger
    setTimeout(() => {
      checkLevel();
    }, 1000);
  };

  const extinguishCandle = () => {
    console.log('🔥 Extinguishing candle', currentCandleRef.current, 'of', totalCandles);

    // Update candles state
    setCandlesLit(prevCandles => {
      const newCandles = [...prevCandles];
      newCandles[currentCandleRef.current] = false;
      return newCandles;
    });
    candlesLitRef.current[currentCandleRef.current] = false;
    
    // Update score
    setScore(prevScore => prevScore + 20);
    
    // Move to next candle or complete game
    if (currentCandleRef.current < totalCandles - 1) {
      setTimeout(() => {
        const nextCandle = currentCandleRef.current + 1;
        console.log('🎯 Moving to next candle:', nextCandle);
        setCurrentCandle(nextCandle);
        currentCandleRef.current = nextCandle;
        // Reset timing for next candle
        lastExtinguishTime.current = Date.now() - 1000; // Allow next trigger after 1 second
      }, 500);
    } else {
      console.log('🎉 All candles extinguished! Game complete!');
      setGameComplete(true);
      stopListening();
    }
  };

  const handleManualBlow = () => {
    if (candlesLitRef.current[currentCandleRef.current]) {
      setAttempts(prev => prev + 1);
      // Simulate blow strength
      const strength = Math.random() * 100;
      setBlowStrength(strength);
      
      setTimeout(() => {
        if (strength > 80) {
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
    candlesLitRef.current = [true, true, true, true, true];
    setScore(0);
    setAttempts(0);
    setCurrentCandle(0);
    currentCandleRef.current = 0;
    setGameComplete(false);
    setBlowStrength(0);
    setMicrophoneError(null);
    lastExtinguishTime.current = Date.now() + 3000; // Wait before first blow
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
              {blowStrength > 80 ? '🌬️ Perfect blow!' :
               blowStrength > 40 ? '💨 Good, blow harder!' :
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
              className="w-80 h-60"
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
