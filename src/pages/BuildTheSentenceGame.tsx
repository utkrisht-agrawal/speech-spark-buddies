import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Plus } from 'lucide-react';
import AvatarGuide from '@/components/AvatarGuide';

interface BuildTheSentenceGameProps {
  targetSentences?: string[];
  onComplete?: (score: number) => void;
  onBack?: () => void;
}

const BuildTheSentenceGame: React.FC<BuildTheSentenceGameProps> = ({ 
  targetSentences = [
    'I eat apple',
    'She jumps high', 
    'We like mango',
    'He reads book',
    'They play game'
  ],
  onComplete,
  onBack 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [wordsBuilt, setWordsBuilt] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [wordDetected, setWordDetected] = useState(false);
  const [sentencesBuilt, setSentencesBuilt] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastWordTime = useRef(0);

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
      
      const detected = level > 30;
      setWordDetected(detected);

      if (detected && Date.now() - lastWordTime.current > 1500) {
        addWord();
        lastWordTime.current = Date.now();
      }

      animationFrameRef.current = requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const addWord = () => {
    const targetWords = targetSentences[currentSentence].split(' ');
    
    if (wordsBuilt.length < targetWords.length) {
      const nextWord = targetWords[wordsBuilt.length];
      const newWordsBuilt = [...wordsBuilt, nextWord];
      setWordsBuilt(newWordsBuilt);
      
      const newScore = score + 20;
      setScore(newScore);

      if (newWordsBuilt.length >= targetWords.length) {
        // Sentence complete
        setTimeout(() => {
          const newSentencesBuilt = sentencesBuilt + 1;
          setSentencesBuilt(newSentencesBuilt);
          
          if (newSentencesBuilt >= targetSentences.length) {
            setGameComplete(true);
            stopListening();
            onComplete?.(newScore + 50); // Bonus for completion
          } else {
            nextSentence();
          }
        }, 2000);
      }
    }
  };

  const nextSentence = () => {
    setCurrentSentence(prev => prev + 1);
    setWordsBuilt([]);
  };

  const resetGame = () => {
    setCurrentSentence(0);
    setWordsBuilt([]);
    setScore(0);
    setSentencesBuilt(0);
    setGameComplete(false);
    setAudioLevel(0);
    setWordDetected(false);
    stopListening();
  };

  const getCurrentTargetWords = () => targetSentences[currentSentence].split(' ');
  const getNextWord = () => {
    const targetWords = getCurrentTargetWords();
    return wordsBuilt.length < targetWords.length ? targetWords[wordsBuilt.length] : null;
  };

  useEffect(() => {
    return () => stopListening();
  }, [stopListening]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            🏗️ Build the Sentence
          </h1>
          <p className="text-gray-600">
            Say each word to build complete sentences!
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Sentence Building</span>
              <span className="text-sm font-normal">
                Score: {score} | Built: {sentencesBuilt}/{targetSentences.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={(sentencesBuilt / targetSentences.length) * 100} className="h-6" />
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Voice Level</span>
                <span className={`text-sm font-bold ${wordDetected ? 'text-green-600' : 'text-gray-400'}`}>
                  {wordDetected ? '📝 Adding word!' : '👂 Listening...'}
                </span>
              </div>
              <Progress value={audioLevel} className="h-4" />
            </div>
            
            <div className="text-center">
              <p className="text-lg text-blue-700">
                Progress: {wordsBuilt.length}/{getCurrentTargetWords().length} words
              </p>
            </div>
            
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
            mood={gameComplete ? 'celebrating' : wordsBuilt.length === getCurrentTargetWords().length ? 'celebrating' : 'encouraging'}
            message={
              gameComplete ? '🎉 All sentences built!' :
              wordsBuilt.length === getCurrentTargetWords().length ? '✅ Sentence complete!' :
              isListening ? `Say "${getNextWord()}" to continue building!` :
              'Press start to begin building sentences!'
            }
          />
        </div>

        {/* Sentence Building Area */}
        {!gameComplete && (
          <Card className="mb-6 bg-gradient-to-b from-yellow-100 to-green-100">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-blue-800 mb-4">
                  Sentence {currentSentence + 1}
                </h2>
                
                {/* Target sentence (hidden) */}
                <div className="bg-gray-100 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-bold text-gray-600 mb-2">Target:</h3>
                  <div className="text-xl text-gray-400">
                    {getCurrentTargetWords().map((word, index) => (
                      <span key={index} className="mx-1">
                        {index < wordsBuilt.length ? word : '___'}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Built sentence */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
                  <h3 className="text-lg font-bold text-blue-700 mb-4">Your Sentence:</h3>
                  <div className="flex flex-wrap justify-center gap-3 min-h-[3rem]">
                    {wordsBuilt.map((word, index) => (
                      <div 
                        key={index}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-xl font-bold shadow-md animate-fadeIn"
                      >
                        {word}
                      </div>
                    ))}
                    
                    {getNextWord() && (
                      <div className="px-4 py-2 border-2 border-dashed border-blue-300 text-blue-300 rounded-lg text-xl font-bold flex items-center">
                        <Plus className="w-6 h-6 mr-2" />
                        {getNextWord()}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Next word instruction */}
                {getNextWord() && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-lg text-blue-700 mb-2">Say the next word:</p>
                    <div className="text-3xl font-bold text-blue-800">
                      "{getNextWord()}"
                    </div>
                  </div>
                )}
                
                {wordsBuilt.length === getCurrentTargetWords().length && (
                  <div className="text-green-600 text-2xl font-bold animate-bounce">
                    ✅ Sentence complete! Moving to next...
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
                  Start Building
                </Button>
              ) : (
                <Button onClick={stopListening} variant="destructive">
                  Stop Listening
                </Button>
              )}
              
              <Button 
                variant="outline"
                onClick={() => addWord()}
                disabled={!getNextWord()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Word
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="bg-green-100 p-4 rounded-xl">
                <Trophy className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-800">All Sentences Built!</h3>
                <p className="text-green-700">
                  You built {sentencesBuilt} sentences! Final Score: {score} points
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Sentences
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
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.8); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BuildTheSentenceGame;