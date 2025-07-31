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

interface VisemePracticeProps {
  onBack?: () => void;
  onComplete?: (score: number) => void;
}

// Sample words with their phoneme breakdowns
const practiceWords = [
  { word: "HELLO", phonemes: ['H', 'EH', 'L', 'OH'] },
  { word: "APPLE", phonemes: ['AH', 'P', 'AH', 'L'] },
  { word: "MOTHER", phonemes: ['M', 'AH', 'TH', 'ER'] },
  { word: "FISH", phonemes: ['F', 'IH', 'S', 'H'] },
  { word: "BOOK", phonemes: ['B', 'UH', 'K'] },
  { word: "WATER", phonemes: ['W', 'AH', 'T', 'ER'] },
];

const VisemePractice: React.FC<VisemePracticeProps> = ({ onBack, onComplete }) => {
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
  
  // Advanced speech recognition instance
  const [speechRecognition] = useState(() => new AdvancedSpeechRecognition());
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const currentWord = practiceWords[currentWordIndex];

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
    <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="flex items-center gap-1 h-8"
        >
          <ArrowLeft className="w-3 h-3" />
          Back
        </Button>
        
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-800">Viseme Practice</h1>
          <p className="text-xs text-gray-600">
            Word {currentWordIndex + 1} of {practiceWords.length}
          </p>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <Star className="w-3 h-3 text-yellow-500" />
          <span className="font-semibold text-xs">{score}</span>
        </div>
      </div>

      {/* Main Content - No scroll */}
      <div className="flex-1 max-w-full mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
          
          {/* Main Practice Card - 2/3 width */}
          <div className="lg:col-span-2 h-full">
            <Card className="p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 h-full flex flex-col">
              
              {/* Compact Header with Word Navigation */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {currentWord.word}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {currentWordIndex + 1} / {practiceWords.length}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    onClick={handlePreviousWord}
                    variant="outline"
                    size="sm"
                    disabled={currentWordIndex === 0}
                    className="h-8 px-2 text-xs"
                  >
                    ← Prev
                  </Button>
                  <Button
                    onClick={handleNextWord}
                    variant="outline"
                    size="sm"
                    disabled={currentWordIndex === practiceWords.length - 1}
                    className="h-8 px-2 text-xs"
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {/* Phoneme Division */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Phonemes</h3>
                <div className="flex gap-1 mb-3 flex-wrap">
                  {currentWord.phonemes.map((phoneme, index) => (
                    <Button
                      key={index}
                      onClick={() => setCurrentPhonemeIndex(index)}
                      variant={index === currentPhonemeIndex ? "default" : "outline"}
                      size="sm"
                      className={`min-w-[50px] h-7 text-xs ${
                        index === currentPhonemeIndex 
                          ? "bg-purple-600 text-white" 
                          : "bg-white text-gray-700 hover:bg-purple-50"
                      }`}
                    >
                      {phoneme}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Lip Animation Guide - Flexible height */}
              <div className="bg-white rounded-xl p-4 border border-gray-200 flex-1 flex">
                {/* Left Side - Controls */}
                <div className="flex flex-col gap-2 pr-4 border-r border-gray-200 min-w-[140px]">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Controls
                  </h3>
                  
                  {/* Audio Controls */}
                  <Button
                    onClick={() => speak(currentWord.word)}
                    disabled={isSpeaking}
                    variant="outline"
                    size="sm"
                    className="bg-white h-8 text-xs justify-start"
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    {isSpeaking ? 'Playing...' : 'Hear Word'}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const utterance = new SpeechSynthesisUtterance(currentWord.phonemes[currentPhonemeIndex]);
                      utterance.rate = 0.6;
                      speechSynthesis.speak(utterance);
                    }}
                    variant="outline"
                    size="sm"
                    className="bg-white h-8 text-xs justify-start"
                  >
                    🔊 Hear Phoneme
                  </Button>
                  
                  {/* Speed Control */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-600">Speed:</span>
                    <select 
                      className="text-xs border rounded px-2 py-1 bg-white"
                      onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                      value={animationSpeed}
                    >
                      <option value={1200}>Slow</option>
                      <option value={800}>Normal</option>
                      <option value={500}>Fast</option>
                    </select>
                  </div>
                  
                  {/* Navigation Controls */}
                  <div className="flex gap-1">
                    <Button
                      onClick={() => setCurrentPhonemeIndex(Math.max(0, currentPhonemeIndex - 1))}
                      variant="outline"
                      size="sm"
                      disabled={currentPhonemeIndex === 0}
                      className="h-7 px-2 text-xs flex-1"
                    >
                      ← Prev
                    </Button>
                    <Button
                      onClick={() => setCurrentPhonemeIndex(Math.min(currentWord.phonemes.length - 1, currentPhonemeIndex + 1))}
                      variant="outline"
                      size="sm"
                      disabled={currentPhonemeIndex === currentWord.phonemes.length - 1}
                      className="h-7 px-2 text-xs flex-1"
                    >
                      Next →
                    </Button>
                  </div>
                  
                  {/* Test Controls */}
                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      onClick={testPhoneme}
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs mb-2 bg-blue-600 hover:bg-blue-700"
                      disabled={isRecording}
                    >
                      {isRecording ? <MicOff className="w-3 h-3 mr-1" /> : <Mic className="w-3 h-3 mr-1" />}
                      Test Phoneme
                    </Button>
                    
                    <Button
                      onClick={testWord}
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                      disabled={isRecording || isLooping}
                    >
                      {isLooping ? <Square className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                      Test Word
                    </Button>
                  </div>
                </div>
                
                {/* Right Side - Animation */}
                <div className="flex-1 flex flex-col pl-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Lip Animation Guide
                    </h3>
                    <div className="text-xs text-gray-600">
                      Current: <span className="font-semibold text-purple-600">
                        {currentWord.phonemes[currentPhonemeIndex]}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center flex-1 bg-gray-50 rounded-lg p-3">
                    <AnimatedLips
                      phoneme={currentWord.phonemes[currentPhonemeIndex]}
                      isAnimating={isAnimating}
                      className="transform scale-75"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Practice & Analysis Card - 1/3 width */}
          <div className="lg:col-span-1 h-full">
            <Card className="p-4 bg-white border-2 border-green-200 h-full flex flex-col">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Practice & Analysis
              </h3>
              
              {/* Camera Widget */}
              <div className="mb-4 flex-1">
                <CameraWindow
                  isActive={isCameraActive}
                  className="h-32 sm:h-40 lg:h-48 rounded-lg w-full"
                />
              </div>
              
              {/* Sound Waveform */}
              <div className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Sound Waveform</h4>
                <div className="h-12 bg-gradient-to-r from-green-200 to-blue-200 rounded flex items-center justify-center">
                  <div className="flex items-end gap-0.5 h-10">
                    {audioData.length > 0 ? (
                      audioData.map((height, i) => (
                        <div
                          key={i}
                          className="bg-green-500 w-1 rounded-t transition-all duration-100"
                          style={{ height: `${Math.max(10, height)}%` }}
                        />
                      ))
                    ) : (
                      [...Array(15)].map((_, i) => (
                        <div
                          key={i}
                          className="bg-gray-400 w-1 rounded-t"
                          style={{ height: '20%' }}
                        />
                      ))
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {isRecording ? 'Recording...' : isProcessing ? 'Processing...' : 'Ready to record'}
                </p>
                {recognitionResult && (
                  <p className="text-xs text-blue-600 mt-1 text-center">
                    Heard: "{recognitionResult}"
                  </p>
                )}
              </div>
              
              {/* Audio Playback */}
              <div className="mb-4">
                <AudioPlayback 
                  audioBlob={lastRecordedAudio} 
                  label="Last Recording" 
                />
              </div>
              
              {/* Compact Scoring Section */}
              <div className="space-y-2">
                <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                  <h4 className="text-xs font-semibold text-blue-800 mb-1">Lip Shape Match</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${lipScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-blue-600">{lipScore}%</span>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <h4 className="text-xs font-semibold text-green-800 mb-1">Sound Match</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-green-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${soundScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-600">{soundScore}%</span>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                  <h4 className="text-xs font-semibold text-purple-800 mb-1">Overall Score</h4>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{score}</div>
                    <div className="text-xs text-purple-700">Points</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Compact Instructions */}
        <div className="mt-3">
          <Card className="p-3 bg-blue-50 border border-blue-200">
            <h4 className="text-sm font-semibold text-blue-800 mb-1">
              💡 Tips
            </h4>
            <div className="text-xs text-blue-700 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>• Watch viseme guide</div>
              <div>• Copy lip shapes</div>
              <div>• Check with camera</div>
              <div>• Practice slowly</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VisemePractice;