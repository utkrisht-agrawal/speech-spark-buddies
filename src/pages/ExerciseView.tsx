import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, RotateCcw, ChevronRight, Volume2, Mic } from 'lucide-react';
import { Exercise } from '@/types/curriculum';
import AvatarGuide from '@/components/AvatarGuide';
import RecordButton from '@/components/RecordButton';
import ScoreCard from '@/components/ScoreCard';
import { CameraWindow } from '@/components/CameraWindow';
import AnimatedLips from '@/components/AnimatedLips';
import { AdvancedSpeechRecognition } from '@/utils/speechRecognition';

interface ExerciseViewProps {
  exercise: Exercise;
  onComplete: (score: number) => void;
  onBack: () => void;
}

const ExerciseView: React.FC<ExerciseViewProps> = ({ exercise, onComplete, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [spokenWords, setSpokenWords] = useState<string[]>([]);
  const [speechRecognition] = useState(() => new AdvancedSpeechRecognition());
  const [isProcessing, setIsProcessing] = useState(false);
  const [lipShapeMatch, setLipShapeMatch] = useState(75);
  const [soundMatch, setSoundMatch] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [currentPhonemeIndex, setCurrentPhonemeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(800);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<string>("");
  const [lastRecordedAudio, setLastRecordedAudio] = useState<Blob | null>(null);

  const isArrayContent = Array.isArray(exercise.content);
  const currentContent = isArrayContent ? exercise.content[currentIndex] : exercise.content;
  const totalItems = isArrayContent ? exercise.content.length : 1;
  const progress = ((currentIndex + 1) / totalItems) * 100;

  const startRecording = async () => {
    try {
      setIsRecording(true);
      await speechRecognition.startRecording();
      
      // Generate random waveform data for visualization
      const interval = setInterval(() => {
        setAudioData(prev => [...prev.slice(-14), Math.random() * 100].slice(-15));
      }, 100);

      // Calculate recording duration based on exercise type
      let recordingDuration = 2000; // Default 2 seconds for phoneme
      if (exercise.type === 'word') {
        recordingDuration = 3000; // 3 seconds for words
      } else if (exercise.type === 'sentence') {
        const wordCount = currentContent.toString().split(' ').length;
        recordingDuration = wordCount * 2000; // 2 seconds per word for sentences
      }

      setTimeout(async () => {
        if (speechRecognition.isRecording()) {
          const audioBlob = await speechRecognition.stopRecording();
          clearInterval(interval);
          setIsRecording(false);
          setLastRecordedAudio(audioBlob);
          
          // Process with backend
          const target = getCurrentTarget();
          console.log(`🎯 Processing target: "${target}"`);
          
          const result = await speechRecognition.recognizeSpeech(audioBlob, target);
          console.log(`🗣️ Backend result:`, result);
          
          setSoundMatch(result.similarityScore);
          setRecognitionResult(result.transcription);
          setHasRecorded(true);
          setShowScore(true);
          
          // Store results
          setSpokenWords(prev => {
            const newSpoken = [...prev];
            newSpoken[currentIndex] = result.transcription;
            return newSpoken;
          });
          
          setScores(prev => {
            const newScores = [...prev];
            newScores[currentIndex] = result.similarityScore;
            return newScores;
          });
        }
      }, recordingDuration);
    } catch (error) {
      console.error('Error with backend recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (speechRecognition.isRecording()) {
      try {
        const audioBlob = await speechRecognition.stopRecording();
        setIsRecording(false);
        setLastRecordedAudio(audioBlob);
        
        const target = getCurrentTarget();
        const result = await speechRecognition.recognizeSpeech(audioBlob, target);
        
        setSoundMatch(result.similarityScore);
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
      setLipShapeMatch(newLipScore);
      setIsAnimating(false);
    }, 3000);
  };

  const testWord = async () => {
    setIsLooping(true);
    setIsAnimating(true);
    
    try {
      await speechRecognition.startRecording();
      setIsRecording(true);
      
      // Animate through phonemes if available
      if (targetPhonemes.length > 0) {
        let phonemeIndex = 0;
        const interval = setInterval(() => {
          setCurrentPhonemeIndex(phonemeIndex);
          phonemeIndex++;
          if (phonemeIndex >= targetPhonemes.length) {
            setIsLooping(false);
            setIsAnimating(false);
            clearInterval(interval);
          }
        }, animationSpeed);
      }
      
      // Generate waveform data during recording
      const waveformInterval = setInterval(() => {
        setAudioData(prev => [...prev.slice(-14), Math.random() * 100].slice(-15));
      }, 100);
      
      // Calculate recording duration based on exercise type
      let recordingDuration = 3000; // Default 3 seconds for words
      if (exercise.type === 'sentence') {
        const wordCount = currentContent.toString().split(' ').length;
        recordingDuration = wordCount * 2000; // 2 seconds per word for sentences
      } else if (exercise.type === 'phoneme') {
        recordingDuration = 2000; // 2 seconds for phonemes
      }
      
      setTimeout(async () => {
        try {
          clearInterval(waveformInterval);
          const audioBlob = await speechRecognition.stopRecording();
          setIsRecording(false);
          setLastRecordedAudio(audioBlob);
          
          const target = currentContent.toString();
          const result = await speechRecognition.recognizeSpeech(audioBlob, target);
          
          setSoundMatch(result.similarityScore);
          setRecognitionResult(result.transcription);
          
          // Simulate lip score for the complete word
          const avgLipScore = Math.floor(Math.random() * 30) + 70;
          setLipShapeMatch(avgLipScore);
          
          console.log(`🎯 Target: "${target}", Got: "${result.transcription}", Score: ${result.similarityScore}%`);
          
          setHasRecorded(true);
          setShowScore(true);
          
          // Store results
          setSpokenWords(prev => {
            const newSpoken = [...prev];
            newSpoken[currentIndex] = result.transcription;
            return newSpoken;
          });
          
          setScores(prev => {
            const newScores = [...prev];
            newScores[currentIndex] = result.similarityScore;
            return newScores;
          });
        } catch (error) {
          console.error('Word recognition failed:', error);
          setSoundMatch(0);
          setRecognitionResult('Recognition failed');
        }
      }, recordingDuration);
      
    } catch (error) {
      console.error('Error with backend word testing:', error);
      setIsLooping(false);
      setIsAnimating(false);
    }
  };

  const getCurrentTarget = () => {
    if (exercise.type === 'phoneme') {
      return currentContent.toString();
    } else if (exercise.type === 'word') {
      return currentContent.toString();
    } else if (exercise.type === 'sentence') {
      return currentContent.toString();
    }
    return currentContent.toString();
  };

  const generateMockSpokenText = (target: string): string => {
    // Simulate common speech recognition variations
    const variations = {
      'cat': ['cat', 'kat', 'cot'],
      'dog': ['dog', 'tog', 'dug'],
      'apple': ['apple', 'aple', 'apel'],
      'red circle': ['red circle', 'red curcle', 'wed circle'],
    };
    
    const targetStr = target.toString().toLowerCase();
    const possibleVariations = variations[targetStr as keyof typeof variations] || [targetStr];
    return possibleVariations[Math.floor(Math.random() * possibleVariations.length)];
  };

  const calculateMockScore = (target: string, spoken: string): number => {
    const targetStr = target.toString().toLowerCase();
    const spokenStr = spoken.toLowerCase();
    
    if (targetStr === spokenStr) return 95 + Math.random() * 5;
    
    // Calculate similarity based on character differences
    const similarity = 1 - (Math.abs(targetStr.length - spokenStr.length) / Math.max(targetStr.length, spokenStr.length));
    return Math.max(60, similarity * 100 + Math.random() * 10);
  };

  const handleRetry = () => {
    setHasRecorded(false);
    setShowScore(false);
  };

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(prev => prev + 1);
      setHasRecorded(false);
      setShowScore(false);
    } else {
      // Exercise complete
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      onComplete(averageScore);
    }
  };

  const playPronunciation = () => {
    console.log(`Playing pronunciation for: ${currentContent}`);
    // Mock pronunciation playback
  };


  const currentPhonemes = exercise.targetPhonemes || [];
  const targetPhonemes = exercise.type === 'phoneme' 
    ? [currentContent.toString()]
    : currentPhonemes;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 flex flex-col">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-6 px-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">{exercise.title}</h1>
          <p className="text-sm text-gray-600">
            {currentIndex + 1} of {totalItems}
          </p>
        </div>

        <div className="flex items-center gap-2 text-lg">
          <div className="text-4xl font-bold text-purple-600">{overallScore}</div>
        </div>
      </div>

      {/* Main Content - Full width responsive */}
      <div className="flex-1 w-full">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full max-w-7xl mx-auto">
          
          {/* Main Practice Card - 2/3 width */}
          <div className="xl:col-span-2 h-full">
            <Card className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 h-full flex flex-col">
              
              {/* Header with Content Navigation */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-200">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    {currentContent}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currentIndex + 1} / {totalItems}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    variant="outline"
                    size="default"
                    disabled={currentIndex === 0}
                    className="px-4"
                  >
                    ← Prev
                  </Button>
                  <Button
                    onClick={() => setCurrentIndex(Math.min(totalItems - 1, currentIndex + 1))}
                    variant="outline"
                    size="default"
                    disabled={currentIndex === totalItems - 1}
                    className="px-4"
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {/* Phoneme/Content Division */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {exercise.type === 'phoneme' ? 'Phonemes' : 
                   exercise.type === 'word' ? 'Words' : 
                   exercise.type === 'sentence' ? 'Sentences' : 'Content'}
                </h3>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {isArrayContent ? (exercise.content as string[]).map((item, idx) => (
                    <Button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      variant={idx === currentIndex ? "default" : "outline"}
                      size="default"
                      className={`min-w-[60px] ${
                        idx === currentIndex 
                          ? "bg-purple-600 text-white" 
                          : "bg-white text-gray-700 hover:bg-purple-50"
                      }`}
                    >
                      {exercise.type === 'phoneme' ? `/${item}/` : item.toString().toUpperCase()}
                    </Button>
                  )) : (
                    <Button variant="default" size="default">
                      {exercise.type === 'phoneme' ? `/${currentContent}/` : currentContent.toString().toUpperCase()}
                    </Button>
                  )}
                </div>
              </div>

              {/* Lip Animation Guide - Flexible height */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 flex-1 flex">
                {/* Left Side - Controls */}
                <div className="flex flex-col gap-3 pr-6 border-r border-gray-200 min-w-[180px]">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    Controls
                  </h3>
                  
                  {/* Audio Controls */}
                  <Button
                    onClick={playPronunciation}
                    variant="outline"
                    size="default"
                    className="bg-white justify-start"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Hear Word
                  </Button>
                  
                  <Button
                    onClick={playPronunciation}
                    variant="outline"
                    size="default"
                    className="bg-white justify-start"
                  >
                    🔊 Hear Phoneme
                  </Button>
                  
                  {/* Speed Control */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm text-gray-600">Speed:</span>
                    <select 
                      className="text-sm border rounded px-3 py-2 bg-white"
                      onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                      value={animationSpeed}
                    >
                      <option value={1200}>Slow</option>
                      <option value={800}>Normal</option>
                      <option value={500}>Fast</option>
                    </select>
                  </div>
                  
                  {/* Test Controls */}
                  <div className="pt-4 border-t border-gray-200">
                    <Button
                      onClick={testPhoneme}
                      variant="default"
                      size="default"
                      className="w-full mb-3 bg-blue-600 hover:bg-blue-700"
                      disabled={isRecording || isProcessing}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Test Phoneme
                    </Button>
                    
                    <Button
                      onClick={testWord}
                      variant="default"
                      size="default"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isRecording || isProcessing || isLooping}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Test Word
                    </Button>
                  </div>
                </div>
                
                {/* Right Side - Animation */}
                <div className="flex-1 flex flex-col pl-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Lip Guide
                    </h3>
                    {(isLooping || isAnimating) && (
                      <Badge variant="secondary">
                        {isLooping ? "🔄 Looping" : "⏯️ Animating"}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <AnimatedLips 
                      phoneme={targetPhonemes[currentPhonemeIndex] || currentContent.toString()}
                      isAnimating={false}
                      className="scale-100"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Status Cards */}
          <div className="xl:col-span-1 h-full">
            <div className="grid grid-rows-2 gap-6 h-full">
              
            {/* Camera Card */}
            <Card className="bg-white border-2 border-gray-200 h-full flex flex-col">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  📹 Live Camera
                  <Badge variant={isCameraActive ? "default" : "secondary"}>
                    {isCameraActive ? "ON" : "OFF"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <CameraWindow className="w-full h-full object-cover" />
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  Lip shape analysis: <span className="font-semibold text-purple-600">{lipShapeMatch}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Recording Card */}
            <Card className="bg-white border-2 border-gray-200 h-full flex flex-col">
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  🎤 Recording
                  <Badge variant={isRecording ? "destructive" : "secondary"}>
                    {isRecording ? "REC" : "READY"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 flex-1 flex flex-col">
                {/* Audio waveform */}
                <div className="h-16 bg-gray-100 rounded-lg mb-3 flex items-end justify-center gap-1 px-2">
                  {audioData.map((height, idx) => (
                    <div
                      key={idx}
                      className="bg-blue-500 rounded-sm transition-all duration-100"
                      style={{
                        height: `${height * 0.6}%`,
                        width: '8px',
                        opacity: isRecording ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                
                {/* Play button for recorded audio */}
                {lastRecordedAudio && (
                  <Button
                    onClick={() => {
                      const audio = new Audio(URL.createObjectURL(lastRecordedAudio));
                      audio.play();
                    }}
                    variant="outline"
                    size="default"
                    className="mb-3"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Play Recording
                  </Button>
                )}
                
                {/* Score display */}
                {showScore && (
                  <div className="space-y-2 flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600">Sound Match:</span>
                        <span className="font-semibold text-green-600">{soundMatch}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Recognition:</span>
                        <span className="font-semibold text-blue-600 truncate max-w-32" title={recognitionResult}>
                          {recognitionResult}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        size="default"
                        className="flex-1"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                      <Button
                        onClick={handleNext}
                        variant="default"
                        size="default"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseView;