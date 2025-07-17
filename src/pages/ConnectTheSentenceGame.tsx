import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Link } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

interface ConnectTheSentenceGameProps {
  sentencePairs?: { first: string; connector: string; second: string; complete: string }[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const ConnectTheSentenceGame: React.FC<ConnectTheSentenceGameProps> = ({ 
  sentencePairs = [
    { 
      first: 'I like apples', 
      connector: 'and', 
      second: 'I like bananas',
      complete: 'I like apples and I like bananas'
    },
    { 
      first: 'He is happy', 
      connector: 'because', 
      second: 'he won the game',
      complete: 'He is happy because he won the game'
    },
    { 
      first: 'She wants to play', 
      connector: 'but', 
      second: 'it is raining',
      complete: 'She wants to play but it is raining'
    },
    { 
      first: 'We study hard', 
      connector: 'and', 
      second: 'we get good grades',
      complete: 'We study hard and we get good grades'
    },
    { 
      first: 'The cat is sleeping', 
      connector: 'because', 
      second: 'it is tired',
      complete: 'The cat is sleeping because it is tired'
    }
  ],
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentPair, setCurrentPair] = useState(0);
  const [connectionStage, setConnectionStage] = useState<'first' | 'connector' | 'second' | 'complete'>('first');
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [speechDetected, setSpeechDetected] = useState(false);
  const [connectionsCompleted, setConnectionsCompleted] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpeechTime = useRef(0);

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

      if (detected && Date.now() - lastSpeechTime.current > 2000) {
        advanceStage();
        lastSpeechTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const advanceStage = () => {
    const newScore = score + 25;
    setScore(newScore);

    if (connectionStage === 'first') {
      setConnectionStage('connector');
    } else if (connectionStage === 'connector') {
      setConnectionStage('second');
    } else if (connectionStage === 'second') {
      setConnectionStage('complete');
    } else if (connectionStage === 'complete') {
      const newCompleted = connectionsCompleted + 1;
      setConnectionsCompleted(newCompleted);
      
      setTimeout(() => {
        if (newCompleted >= sentencePairs.length) {
          setGameComplete(true);
          stopListening();
          onComplete?.(newScore);
        } else {
          setCurrentPair(prev => prev + 1);
          setConnectionStage('first');
        }
      }, 1500);
    }
  };

  const resetGame = () => {
    setCurrentPair(0);
    setConnectionStage('first');
    setScore(0);
    setConnectionsCompleted(0);
    setGameComplete(false);
    setAudioLevel(0);
    setSpeechDetected(false);
    stopListening();
  };

  const getCurrentText = () => {
    const pair = sentencePairs[currentPair];
    switch (connectionStage) {
      case 'first': return pair.first;
      case 'connector': return pair.connector;
      case 'second': return pair.second;
      case 'complete': return pair.complete;
      default: return '';
    }
  };

  const getStageDescription = () => {
    switch (connectionStage) {
      case 'first': return 'Say the first part';
      case 'connector': return 'Say the connector word';
      case 'second': return 'Say the second part';
      case 'complete': return 'Say the complete sentence';
      default: return '';
    }
  };

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-800 mb-2">
            🔗 Connect the Sentence
          </h1>
          <p className="text-gray-600">
            Build connected sentences using and, but, because!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connection Progress</span>
              <span className="text-sm font-normal">
                Score: {score} | Connected: {connectionsCompleted}/{sentencePairs.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={(connectionsCompleted / sentencePairs.length) * 100} className="h-6" />
            </div>
            
            <div className="mb-4">
              <Progress value={audioLevel} className="h-4" />
            </div>
            
            <p className="text-sm text-center text-gray-600">
              Stage: {getStageDescription()}
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
              gameComplete ? '🎉 All sentences connected!' :
              isListening ? `${getStageDescription()}: "${getCurrentText()}"` :
              'Press start to begin connecting sentences!'
            }
          />
        </div>

        {/* Connection Visualization */}
        {!gameComplete && (
          <Card className="mb-6 bg-gradient-to-b from-teal-100 to-emerald-100">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-emerald-800 mb-4">
                  Sentence {currentPair + 1}
                </h3>
                
                {/* Visual connection builder */}
                <div className="flex flex-col items-center space-y-4">
                  {/* First part */}
                  <div className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                    connectionStage === 'first' 
                      ? 'border-emerald-500 bg-emerald-100 scale-105' 
                      : ['connector', 'second', 'complete'].includes(connectionStage)
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300 bg-gray-50'
                  }`}>
                    <p className="text-lg font-semibold text-gray-700">
                      {sentencePairs[currentPair].first}
                    </p>
                  </div>
                  
                  {/* Connector */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-0.5 transition-all duration-500 ${
                      connectionStage === 'connector' || (connectionStage === 'second' || connectionStage === 'complete')
                        ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                    <div className={`px-4 py-2 rounded-full border-2 transition-all duration-500 ${
                      connectionStage === 'connector' 
                        ? 'border-emerald-500 bg-emerald-100 scale-110' 
                        : (connectionStage === 'second' || connectionStage === 'complete')
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-300 bg-gray-50'
                    }`}>
                      <span className="font-bold text-emerald-700">
                        {sentencePairs[currentPair].connector}
                      </span>
                    </div>
                    <div className={`w-8 h-0.5 transition-all duration-500 ${
                      connectionStage === 'second' || connectionStage === 'complete'
                        ? 'bg-emerald-500' : 'bg-gray-300'
                    }`} />
                  </div>
                  
                  {/* Second part */}
                  <div className={`p-4 rounded-lg border-2 transition-all duration-500 ${
                    connectionStage === 'second' 
                      ? 'border-emerald-500 bg-emerald-100 scale-105' 
                      : connectionStage === 'complete'
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-300 bg-gray-50'
                  }`}>
                    <p className="text-lg font-semibold text-gray-700">
                      {sentencePairs[currentPair].second}
                    </p>
                  </div>
                </div>
                
                {/* Complete sentence display */}
                {connectionStage === 'complete' && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg border-2 border-emerald-400">
                    <h4 className="text-lg font-bold text-emerald-800 mb-2">Complete Sentence:</h4>
                    <p className="text-xl font-semibold text-emerald-700">
                      "{sentencePairs[currentPair].complete}"
                    </p>
                  </div>
                )}
                
                {/* Current instruction */}
                <div className="mt-6 p-4 bg-white rounded-lg shadow-lg">
                  <p className="text-lg text-gray-600 mb-2">{getStageDescription()}:</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    "{getCurrentText()}"
                  </p>
                </div>
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
                  Start Connecting
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive">
                  Stop Listening
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={advanceStage}
              >
                <Link className="w-4 h-4 mr-2" />
                Next Stage
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-800">All Sentences Connected!</h3>
                <p className="text-green-700">Score: {score} points</p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Connections
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

export default ConnectTheSentenceGame;