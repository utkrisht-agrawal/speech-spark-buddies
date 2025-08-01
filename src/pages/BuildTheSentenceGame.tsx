import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Volume2, RotateCcw, Trophy, Plus } from 'lucide-react';
import { scoreSpeech } from '@/utils/speechRecognition';

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
  const [isRecording, setIsRecording] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [wordsBuilt, setWordsBuilt] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [sentencesBuilt, setSentencesBuilt] = useState(0);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    setCurrentWordIndex(0);
    setWordsBuilt([]);
  }, [currentSentence]);

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
      const targetWords = targetSentences[currentSentence].split(' ');
      const currentWord = targetWords[currentWordIndex];
      if (!currentWord) return;
      
      const result = await scoreSpeech(audioBlob, currentWord, 'word');
      
      if (result.similarityScore >= 90) {
        addCurrentWord();
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

  const addCurrentWord = () => {
    const targetWords = targetSentences[currentSentence].split(' ');
    const currentWord = targetWords[currentWordIndex];
    const newWordsBuilt = [...wordsBuilt, currentWord];
    setWordsBuilt(newWordsBuilt);
    
    const newScore = score + 20;
    setScore(newScore);

    // Move to next word
    const nextWordIndex = currentWordIndex + 1;
    
    if (nextWordIndex >= targetWords.length) {
      // All words in sentence completed
      const newSentencesBuilt = sentencesBuilt + 1;
      setSentencesBuilt(newSentencesBuilt);
      
      setTimeout(() => {
        if (newSentencesBuilt >= targetSentences.length) {
          setGameComplete(true);
          onComplete?.(newScore + 50); // Bonus for completion
        } else {
          nextSentence();
        }
      }, 1500);
    } else {
      // Move to next word
      setCurrentWordIndex(nextWordIndex);
    }
  };

  const nextSentence = () => {
    setCurrentSentence(prev => prev + 1);
    setCurrentWordIndex(0);
    setWordsBuilt([]);
  };

  const resetGame = () => {
    setCurrentSentence(0);
    setCurrentWordIndex(0);
    setWordsBuilt([]);
    setScore(0);
    setSentencesBuilt(0);
    setGameComplete(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  };

  const getCurrentTargetWords = () => targetSentences[currentSentence].split(' ');
  const getNextWord = () => {
    const targetWords = getCurrentTargetWords();
    return currentWordIndex < targetWords.length ? targetWords[currentWordIndex] : null;
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
            
            <div className="text-center">
              <p className="text-lg text-blue-700">
                Progress: {wordsBuilt.length}/{getCurrentTargetWords().length} words
              </p>
              {getNextWord() && (
                <p className="text-sm text-blue-600 mt-2">
                  Say: "<span className="font-bold text-blue-800">{getNextWord()}</span>"
                </p>
              )}
            </div>
            
            {microphoneError && (
              <p className="text-sm text-center text-red-600 mt-2">
                {microphoneError}
              </p>
            )}
          </CardContent>
        </Card>


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