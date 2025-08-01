import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';
import { scoreSpeech } from '@/utils/speechRecognition';

interface SayItToBuildItGameProps {
  targetWords?: string[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const SayItToBuildItGame: React.FC<SayItToBuildItGameProps> = ({ 
  targetWords = ['cat', 'dog', 'fox', 'pig', 'hen'],
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentWord, setCurrentWord] = useState(0);
  const [buildingProgress, setBuildingProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [wordDetected, setWordDetected] = useState(false);
  const [buildingBlocks, setBuildingBlocks] = useState<string[]>([]);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastBuildTime = useRef(0);
  const isCheckingRef = useRef(false);

  const blocksNeeded = 5;

  const getCurrentWord = () => targetWords[currentWord];

  const recordAudioSample = (duration = 1500): Promise<Blob> => {
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
      const result = await scoreSpeech(audioBlob, getCurrentWord(), 'word');
      const spoken = result.transcription.toLowerCase();
      if (
        result.similarityScore >= 75 &&
        spoken.includes(getCurrentWord().toLowerCase())
      ) {
        addBuildingBlock();
      }
    } catch (err) {
      console.error('Word check failed', err);
    } finally {
      isCheckingRef.current = false;
    }
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
      lastBuildTime.current = Date.now();
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
    setWordDetected(false);
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
      const detected = level > 30;
      setWordDetected(detected);

      // Check spoken word if sound level is high
      if (detected && Date.now() - lastBuildTime.current > 1500) {
        checkForWord();
        lastBuildTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const addBuildingBlock = () => {
    if (buildingBlocks.length >= blocksNeeded) return;

    const currentTargetWord = targetWords[currentWord];
    const newBlocks = [...buildingBlocks, currentTargetWord];
    setBuildingBlocks(newBlocks);
    
    const newProgress = (newBlocks.length / blocksNeeded) * 100;
    setBuildingProgress(newProgress);
    
    const newScore = score + 40;
    setScore(newScore);

    if (newBlocks.length >= blocksNeeded) {
      setGameComplete(true);
      stopListening();
      onComplete?.(newScore);
    } else {
      // Move to next word
      setCurrentWord(prev => (prev + 1) % targetWords.length);
    }
  };

  const resetGame = () => {
    setBuildingBlocks([]);
    setBuildingProgress(0);
    setScore(0);
    setCurrentWord(0);
    setGameComplete(false);
    setAudioLevel(0);
    setWordDetected(false);
    stopListening();
  };

  const getBlockColor = (index: number) => {
    const colors = ['bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400'];
    return colors[index % colors.length];
  };

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-orange-800 mb-2">
            🏗️ Say It to Build It
          </h1>
          <p className="text-gray-600">
            Say the words clearly to build your house!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Building Progress</span>
              <span className="text-sm font-normal">
                Score: {score} | Blocks: {buildingBlocks.length}/{blocksNeeded}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={buildingProgress} className="h-6" />
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voice Level</span>
                <span className={`text-sm font-bold ${wordDetected ? 'text-green-600' : 'text-gray-400'}`}>
                  {wordDetected ? '🎯 Word detected!' : '👂 Listening...'}
                </span>
              </div>
              <Progress value={audioLevel} className="h-4" />
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-800 mb-2">
                Say: "{getCurrentWord()}"
              </div>
              <div className="text-lg text-gray-600">
                {getCurrentWord() === 'cat' && '🐱'} 
                {getCurrentWord() === 'dog' && '🐶'} 
                {getCurrentWord() === 'fox' && '🦊'} 
                {getCurrentWord() === 'pig' && '🐷'} 
                {getCurrentWord() === 'hen' && '🐔'}
              </div>
            </div>
            
            <p className="text-sm text-center text-gray-600 mt-4">
              {wordDetected ? '🏗️ Adding building block!' : 
               audioLevel > 20 ? '🗣️ Keep talking!' : 
               '🔇 Say the word clearly!'}
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
              gameComplete ? '🏠 House is complete!' :
              isListening ? `Say "${getCurrentWord()}" to add a building block!` :
              'Press start to begin building!'
            }
          />
        </div>

        {/* Building Area */}
        <Card className="mb-6 bg-gradient-to-b from-blue-100 to-green-100">
          <CardContent className="p-8">
            <div className="relative h-64 flex items-end justify-center">
              {/* Ground */}
              <div className="absolute bottom-0 w-full h-8 bg-green-400 rounded" />
              
              {/* Foundation */}
              <div className="absolute bottom-8 w-48 h-4 bg-gray-600 rounded" />
              
              {/* Building blocks stack */}
              <div className="flex flex-col items-center">
                {buildingBlocks.map((word, index) => (
                  <div 
                    key={index}
                    className={`w-32 h-12 ${getBlockColor(index)} border-2 border-gray-700 rounded mb-1 flex items-center justify-center text-white font-bold shadow-lg transform transition-all duration-500`}
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.2}s both`
                    }}
                  >
                    {word.toUpperCase()}
                  </div>
                ))}
                
                {/* Next block preview (ghosted) */}
                {buildingBlocks.length < blocksNeeded && (
                  <div 
                    className={`w-32 h-12 ${getBlockColor(buildingBlocks.length)} border-2 border-dashed border-gray-400 rounded mb-1 flex items-center justify-center text-gray-500 font-bold opacity-30 ${
                      wordDetected ? 'animate-pulse' : ''
                    }`}
                  >
                    {getCurrentWord().toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Roof (appears when complete) */}
              {gameComplete && (
                <div 
                  className="absolute text-6xl"
                  style={{ 
                    bottom: `${12 + buildingBlocks.length * 12 + 4}px`,
                    animation: 'bounceIn 0.8s ease-out'
                  }}
                >
                  🏠
                </div>
              )}
              
              {/* Construction worker */}
              <div className="absolute bottom-12 -right-4 text-4xl">
                👷‍♂️
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
                  Start Building
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
                <h3 className="text-xl font-bold text-green-800">House Complete!</h3>
                <p className="text-green-700">
                  You built a house with {buildingBlocks.length} blocks! Score: {score} points
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Build Again
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
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default SayItToBuildItGame;