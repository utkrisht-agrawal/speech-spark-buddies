import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Palette } from 'lucide-react';
import { scoreSpeech } from '@/utils/speechRecognition';

interface ColorItRightGameProps {
  targetItems?: { item: string; color: string; emoji: string }[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const ColorItRightGame: React.FC<ColorItRightGameProps> = ({ 
  targetItems = [
    { item: 'apple', color: 'red', emoji: '🍎' },
    { item: 'grass', color: 'green', emoji: '🌱' },
    { item: 'sky', color: 'blue', emoji: '☁️' },
    { item: 'sun', color: 'yellow', emoji: '☀️' },
    { item: 'flower', color: 'pink', emoji: '🌸' }
  ],
  onComplete,
  onBack 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentItem, setCurrentItem] = useState(0);
  const [coloredItems, setColoredItems] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentlyColoring, setCurrentlyColoring] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

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
      const currentColor = getCurrentItem()?.color;
      if (!currentColor) return;
      
      const result = await scoreSpeech(audioBlob, currentColor, 'word');
      
      if (result.similarityScore >= 80) {
        colorItem();
      } else {
        setMicrophoneError(`Say "${currentColor}" - Score: ${Math.round(result.similarityScore)}%`);
        setTimeout(() => setMicrophoneError(null), 2000);
      }
    } catch (error) {
      console.error('Speech scoring failed:', error);
      setMicrophoneError('Speech recognition failed. Try again!');
      setTimeout(() => setMicrophoneError(null), 2000);
    }
  };

  const colorItem = () => {
    setCurrentlyColoring(true);
    
    const newScore = score + 40;
    setScore(newScore);
    const newColoredItems = coloredItems + 1;
    setColoredItems(newColoredItems);

    setTimeout(() => {
      setCurrentlyColoring(false);
      if (newColoredItems >= targetItems.length) {
        setGameComplete(true);
        onComplete?.(newScore);
      } else {
        setCurrentItem(prev => prev + 1);
      }
    }, 2000);
  };

  const resetGame = () => {
    setCurrentItem(0);
    setColoredItems(0);
    setScore(0);
    setGameComplete(false);
    setCurrentlyColoring(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const getCurrentItem = () => targetItems[currentItem];
  
  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'red': 'text-red-500',
      'green': 'text-green-500', 
      'blue': 'text-blue-500',
      'yellow': 'text-yellow-500',
      'pink': 'text-pink-500',
      'purple': 'text-purple-500',
      'orange': 'text-orange-500'
    };
    return colorMap[color] || 'text-gray-500';
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-pink-800 mb-2">
            🎨 Color It Right
          </h1>
          <p className="text-gray-600">
            Say the color name to paint each item correctly!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Coloring Progress</span>
              <span className="text-sm font-normal">
                Score: {score} | Colored: {coloredItems}/{targetItems.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={(coloredItems / targetItems.length) * 100} className="h-6" />
            </div>
            
            
            <div className="text-center">
              <p className="text-lg text-pink-700">
                Current item: {getCurrentItem()?.item}
              </p>
              <p className="text-sm text-pink-600 mt-2">
                Say: "<span className="font-bold text-pink-800">{getCurrentItem()?.color}</span>"
              </p>
            </div>
            
            {microphoneError && (
              <p className="text-sm text-center text-red-600 mt-2">
                {microphoneError}
              </p>
            )}
          </CardContent>
        </Card>


        {/* Coloring Area */}
        {!gameComplete && (
          <Card className="mb-6 bg-gradient-to-b from-purple-100 to-pink-100">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-pink-800 mb-4">
                  Item {currentItem + 1} of {targetItems.length}
                </h2>
                
                {/* Item to color */}
                <div className="text-9xl mb-6 transition-all duration-1000">
                  <span className={currentlyColoring ? getColorClass(getCurrentItem()?.color) : 'text-gray-400'}>
                    {getCurrentItem()?.emoji}
                  </span>
                </div>
                
                {/* Item name and color instruction */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-4">
                  <h3 className="text-2xl font-bold text-gray-700 mb-2">
                    {getCurrentItem()?.item.toUpperCase()}
                  </h3>
                  <p className="text-lg text-gray-600 mb-4">
                    What color should this be?
                  </p>
                  <div className={`text-3xl font-bold ${getColorClass(getCurrentItem()?.color)}`}>
                    {currentlyColoring ? (
                      <span className="animate-pulse">
                        ✨ {getCurrentItem()?.color.toUpperCase()} ✨
                      </span>
                    ) : (
                      `Say: "${getCurrentItem()?.color}"`
                    )}
                  </div>
                </div>
                
                {/* Color palette visualization */}
                <div className="flex justify-center space-x-4 mb-4">
                  {['red', 'green', 'blue', 'yellow', 'pink'].map((color) => (
                    <div 
                      key={color}
                      className={`w-12 h-12 rounded-full border-4 transition-all duration-300 ${
                        getCurrentItem()?.color === color && currentlyColoring
                          ? 'border-yellow-400 scale-125 animate-pulse' 
                          : 'border-gray-300'
                      }`}
                      style={{
                        backgroundColor: color === 'yellow' ? '#fbbf24' : 
                                       color === 'red' ? '#ef4444' :
                                       color === 'green' ? '#22c55e' :
                                       color === 'blue' ? '#3b82f6' :
                                       color === 'pink' ? '#ec4899' : '#6b7280'
                      }}
                    />
                  ))}
                </div>
                
                {currentlyColoring && (
                  <div className="text-green-600 text-xl font-bold animate-bounce">
                    🎨 Perfect coloring!
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
                <h3 className="text-xl font-bold text-green-800">Masterpiece Complete!</h3>
                <p className="text-green-700">
                  You colored {coloredItems} items perfectly! Score: {score} points
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Coloring
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

export default ColorItRightGame;