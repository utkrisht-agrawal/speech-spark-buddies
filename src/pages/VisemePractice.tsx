import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Star, Play, Square, Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CameraWindow } from '@/components/CameraWindow';
import { VisemeGuide } from '@/components/VisemeGuide';
import ScoreCard from '@/components/ScoreCard';
import AnimatedLips from '@/components/AnimatedLips';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { AudioPlayback } from '@/components/AudioPlayback';
import { AdvancedSpeechRecognition, SpeechRecognitionResult } from '@/utils/speechRecognition';
import { comparePhonemes, getPhonemeStyles, PhonemeMatch } from '@/utils/phonemeComparison';

interface VisemePracticeProps {
  onBack?: () => void;
  onComplete?: (score: number) => void;
}

// Words to practice
const practiceWordList = ["HELLO", "APPLE", "MOTHER", "FISH", "BOOK", "WATER"];

const VisemePractice: React.FC<VisemePracticeProps> = ({ onBack, onComplete }) => {
  const [practiceWords, setPracticeWords] = useState<{ word: string; phonemes: string[] }[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopInterval, setLoopInterval] = useState<NodeJS.Timeout | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState(800);
  const [isRecording, setIsRecording] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [lipScore, setLipScore] = useState(75);
  const [soundScore, setSoundScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<string>("");
  const [lastRecordedAudio, setLastRecordedAudio] = useState<Blob | null>(null);
  const [phonemeMatches, setPhonemeMatches] = useState<PhonemeMatch[]>([]);
  
  // Advanced speech recognition instance
  const [speechRecognition] = useState(() => new AdvancedSpeechRecognition());
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const currentWord = practiceWords[currentWordIndex];

  useEffect(() => {
    const fetchPhonemes = async () => {
      const words = await Promise.all(
        practiceWordList.map(async (word) => {
          try {
            const formData = new FormData();
            formData.append('text', word);
            const res = await fetch('http://localhost:8001/phonemeSequence', {
              method: 'POST',
              body: formData
            });
            if (!res.ok) throw new Error('Failed request');
            const data = await res.json();
            const phonemes = Array.isArray(data.phoneme_sequence)
              ? data.phoneme_sequence.map((p: string) => p.toUpperCase())
              : [];
            return { word, phonemes };
          } catch (err) {
            console.error(`Error fetching phonemes for ${word}`, err);
            return { word, phonemes: [] };
          }
        })
      );
      setPracticeWords(words);
    };
    fetchPhonemes();
  }, []);

  // Initialize backend speech recognition
  useEffect(() => {
    console.log("🤖 Using FREE backend speech recognition with Whisper + wav2vec");
  }, []);

  const handleVisemeComplete = () => {
    const newScore = score + 10;
    setScore(newScore);
    setAttempts(attempts + 1);

    if (currentWordIndex < practiceWords.length - 1) {
      // Move to next word after a short delay
      setTimeout(() => {
        setCurrentWordIndex(currentWordIndex + 1);
      }, 1500);
    } else {
      // Practice session complete
      setIsComplete(true);
      onComplete?.(newScore);
    }
  };

  const handleRestart = () => {
    setCurrentWordIndex(0);
    setScore(0);
    setAttempts(0);
    setIsComplete(false);
  };

  const handleNextWord = () => {
    if (currentWordIndex < practiceWords.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  const startRecording = async () => {
    try {
      setIsProcessing(true);
      setIsRecording(true);
      await speechRecognition.startRecording();
      
      // Generate random waveform data for visualization
      const interval = setInterval(() => {
        setAudioData(prev => [...prev.slice(-14), Math.random() * 100].slice(-15));
      }, 100);

      setTimeout(async () => {
        if (speechRecognition.isRecording()) {
          const audioBlob = await speechRecognition.stopRecording();
          clearInterval(interval);
          setIsRecording(false);
          
          // Process with backend
          const target = currentWord.phonemes[currentPhonemeIndex];
          console.log(`🎯 Processing phoneme: "${target}"`);
          
          const result = await speechRecognition.recognizeSpeech(audioBlob, target);
          console.log(`🗣️ Backend result:`, result);
          
          setSoundScore(result.similarityScore);
          setRecognitionResult(result.transcription);
          setIsProcessing(false);
        }
      }, 3000);
    } catch (error) {
      console.error('Error with backend recording:', error);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    if (speechRecognition.isRecording()) {
      try {
        const audioBlob = await speechRecognition.stopRecording();
        setIsRecording(false);
        setLastRecordedAudio(audioBlob); // Store the recorded audio
        
        // Process the audio
        const target = currentWord.phonemes[currentPhonemeIndex];
        const result = await speechRecognition.recognizeSpeech(audioBlob, target);
        
        setSoundScore(result.similarityScore);
        setRecognitionResult(result.transcription);
        setIsProcessing(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
        setIsProcessing(false);
      }
    }
  };

  const testPhoneme = () => {
    setIsAnimating(true);
    startRecording();
    // Simulate lip analysis
    setTimeout(() => {
      const newLipScore = Math.floor(Math.random() * 30) + 70;
      setLipScore(newLipScore);
      setIsAnimating(false);
    }, 3000);
  };

  const testWord = async () => {
    setIsLooping(true);
    setIsAnimating(true);
    setIsProcessing(true);
    
    try {
      await speechRecognition.startRecording();
      setIsRecording(true);
      
      // Animate through phonemes
      let phonemeIndex = 0;
      const interval = setInterval(() => {
        setCurrentPhonemeIndex(phonemeIndex);
        phonemeIndex++;
        if (phonemeIndex >= currentWord.phonemes.length) {
          setIsLooping(false);
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, animationSpeed);
      
      // Generate waveform data during recording
      const waveformInterval = setInterval(() => {
        setAudioData(prev => [...prev.slice(-14), Math.random() * 100].slice(-15));
      }, 100);
      
      // Stop recording after animation completes
      setTimeout(async () => {
        try {
          clearInterval(waveformInterval);
          const audioBlob = await speechRecognition.stopRecording();
          setIsRecording(false);
          
          // Use backend for word-level recognition
          const result = await speechRecognition.recognizeSpeech(audioBlob, currentWord.word);
          
          setSoundScore(result.similarityScore);
          setRecognitionResult(result.transcription);
          
          // Process phoneme analysis if available
          if (result.phonemeAnalysis && result.phonemeAnalysis.spokenPhoneme && result.phonemeAnalysis.targetPhoneme) {
            const matches = comparePhonemes(result.phonemeAnalysis.spokenPhoneme, result.phonemeAnalysis.targetPhoneme);
            setPhonemeMatches(matches);
            console.log('📊 Phoneme comparison:', matches);
          }
          
          // Simulate lip score for the complete word
          const avgLipScore = Math.floor(Math.random() * 30) + 70;
          setLipScore(avgLipScore);
          
          console.log(`🎯 Target: "${currentWord.word}", Got: "${result.transcription}", Score: ${result.similarityScore}%`);
        } catch (error) {
          console.error('Word recognition failed:', error);
          setSoundScore(0);
          setRecognitionResult('Recognition failed');
        } finally {
          setIsProcessing(false);
        }
      }, currentWord.phonemes.length * animationSpeed);
      
    } catch (error) {
      console.error('Error with backend word testing:', error);
      setIsLooping(false);
      setIsAnimating(false);
      setIsProcessing(false);
    }
  };

  if (practiceWords.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading words...
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card className="p-8 text-center bg-white border-2 border-green-200">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Viseme Practice Complete!
            </h2>
            <p className="text-gray-600 mb-6">
              Great job practicing lip movements!
            </p>
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="text-3xl font-bold text-green-600">{score}</div>
              <div className="text-sm text-green-700">Total Score</div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRestart}
                variant="outline"
                className="flex-1"
              >
                Practice Again
              </Button>
              <Button
                onClick={onBack}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex flex-col">
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            
            <div className="flex gap-2">
              <Button 
                onClick={handlePreviousWord}
                disabled={currentWordIndex === 0}
                variant="outline" 
                size="sm" 
                className="text-xs"
              >
                ← Prev
              </Button>
              <Button 
                onClick={handleNextWord}
                disabled={currentWordIndex === practiceWords.length - 1}
                variant="outline" 
                size="sm" 
                className="text-xs"
              >
                Next →
              </Button>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-800">Viseme Practice</h1>
            <p className="text-sm text-gray-600">
              Word {currentWordIndex + 1} of {practiceWords.length}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">{score}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-4 flex flex-col gap-4">
        {/* Top Section: Word + Phonemes */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-4 mb-3">
            <h2 className="text-3xl font-bold text-gray-800">{currentWord.word}</h2>
            <Button
              onClick={() => speak(currentWord.word)}
              disabled={isSpeaking}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" />
              {isSpeaking ? 'Playing...' : 'Hear Word'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {currentWord.phonemes.map((phoneme, index) => {
              const phoneMatch = phonemeMatches[index];
              const isSelected = index === currentPhonemeIndex;
              
              let buttonClass = "min-w-[60px] h-10 border-2 shadow-sm transition-all duration-200";
              
              if (isSelected) {
                buttonClass += " bg-purple-600 text-white border-purple-600";
              } else if (phoneMatch) {
                buttonClass += " " + getPhonemeStyles(phoneMatch.color);
              } else {
                buttonClass += " bg-white text-gray-700 border-gray-300 hover:bg-purple-50";
              }
              
              return (
                <div key={index} className="flex flex-col items-center gap-1">
                  <Button
                    onClick={() => setCurrentPhonemeIndex(index)}
                    variant="outline"
                    className={buttonClass}
                  >
                    {phoneme}
                  </Button>
                  <Button
                    onClick={() => {
                      const utterance = new SpeechSynthesisUtterance(phoneme);
                      utterance.rate = 0.6;
                      speechSynthesis.speak(utterance);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2"
                  >
                    🔊
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Middle Section: Control Panel + Lip Animation + Camera */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Control Panel */}
          <div className="lg:col-span-3">
            <Card className="p-4 h-full min-h-[300px]">
              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">Control Panel</h3>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={testPhoneme}
                  disabled={isAnimating || isProcessing}
                  className="w-full text-sm"
                >
                  {isAnimating ? 'Testing...' : '1. Test Current Phoneme'}
                </Button>
                
                <Button
                  onClick={testWord}
                  disabled={isAnimating || isProcessing}
                  variant="outline"
                  className="w-full text-sm"
                >
                  {isLooping ? 'Testing Word...' : '2. Test Word'}
                </Button>
                
                <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {isRecording ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm">3. Recording...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">3. Ready</span>
                    </div>
                  )}
                </div>
                
                {lastRecordedAudio && (
                  <Button
                    onClick={() => {
                      const audioUrl = URL.createObjectURL(lastRecordedAudio);
                      const audio = new Audio(audioUrl);
                      audio.play();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    4. Listen Recorded Sound
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Lip Animation Guide */}
          <div className="lg:col-span-5">
            <Card className="p-4 h-full min-h-[300px] flex flex-col">
              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">Lip Animation Guide</h3>
              <div className="flex gap-4 items-center mb-4">
                <div className="text-xl lg:text-2xl font-bold text-purple-600">
                  {currentWord.phonemes[currentPhonemeIndex]}
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <AnimatedLips
                  phoneme={currentWord.phonemes[currentPhonemeIndex]}
                  isAnimating={isAnimating}
                  className="w-full h-full"
                />
              </div>
            </Card>
          </div>

          {/* Camera Feed */}
          <div className="lg:col-span-4">
            <Card className="p-4 h-full min-h-[300px] flex flex-col">
              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">Camera Feed</h3>
              <div className="flex-1 min-h-0 overflow-hidden rounded-lg">
                <CameraWindow 
                  isActive={isCameraActive}
                  className="w-full h-full rounded-lg object-cover"
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Section: Waveform Comparison + Scoring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[200px] max-h-[240px] flex-shrink-0">
          {/* Waveform Comparison */}
          <Card className="p-3 md:p-4 flex flex-col">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">Waveform Comparison</h3>
            
            {/* Audio visualization */}
            <div className="bg-gray-50 rounded-lg p-2 md:p-3 flex-1 flex items-center justify-center min-h-[60px]">
              {audioData.length > 0 ? (
                <div className="flex items-end space-x-1 h-8 md:h-12">
                  {audioData.map((amplitude, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 w-1.5 md:w-2 transition-all duration-200"
                      style={{ height: `${amplitude}%` }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-xs md:text-sm">No audio data</div>
              )}
            </div>
            
            {recognitionResult && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-600">Recognized:</div>
                <div className="font-semibold text-sm">{recognitionResult}</div>
              </div>
            )}
          </Card>

          {/* Scoring */}
          <Card className="p-3 md:p-4 flex flex-col">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2 md:mb-3">Score</h3>
            
            <div className="space-y-2 flex-1">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                <span className="text-xs md:text-sm font-medium">Lip Match:</span>
                <span className="text-base md:text-lg font-bold text-green-600">{lipScore}%</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                <span className="text-xs md:text-sm font-medium">Sound Match:</span>
                <span className="text-base md:text-lg font-bold text-blue-600">{soundScore}%</span>
              </div>
              
              <div className="flex justify-between items-center p-2 bg-purple-50 rounded-lg">
                <span className="text-xs md:text-sm font-medium">Total Points:</span>
                <span className="text-lg md:text-xl font-bold text-purple-600">{score}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisemePractice;