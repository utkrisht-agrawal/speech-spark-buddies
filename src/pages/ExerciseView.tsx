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
          <h1 className="text-lg font-bold text-gray-800">{exercise.title}</h1>
          <p className="text-xs text-gray-600">
            {currentIndex + 1} of {totalItems}
          </p>
        </div>

        <div className="flex items-center gap-1 text-sm">
          <div className="text-3xl font-bold text-purple-600">{overallScore}</div>
        </div>
      </div>

      {/* Main Content - No scroll */}
      <div className="flex-1 max-w-full mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
          
          {/* Main Practice Card - 2/3 width */}
          <div className="lg:col-span-2 h-full">
            <Card className="p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 h-full flex flex-col">
              
              {/* Compact Header with Content Navigation */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-200">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {currentContent}
                  </h2>
                  <p className="text-xs text-gray-600">
                    {currentIndex + 1} / {totalItems}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentIndex === 0}
                    className="h-8 px-2 text-xs"
                  >
                    ← Prev
                  </Button>
                  <Button
                    onClick={() => setCurrentIndex(Math.min(totalItems - 1, currentIndex + 1))}
                    variant="outline"
                    size="sm"
                    disabled={currentIndex === totalItems - 1}
                    className="h-8 px-2 text-xs"
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {/* Phoneme/Content Division */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  {exercise.type === 'phoneme' ? 'Phonemes' : 
                   exercise.type === 'word' ? 'Words' : 
                   exercise.type === 'sentence' ? 'Sentences' : 'Content'}
                </h3>
                <div className="flex gap-1 mb-3 flex-wrap">
                  {isArrayContent ? (exercise.content as string[]).map((item, idx) => (
                    <Button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      variant={idx === currentIndex ? "default" : "outline"}
                      size="sm"
                      className={`min-w-[50px] h-7 text-xs ${
                        idx === currentIndex 
                          ? "bg-purple-600 text-white" 
                          : "bg-white text-gray-700 hover:bg-purple-50"
                      }`}
                    >
                      {exercise.type === 'phoneme' ? `/${item}/` : item.toString().toUpperCase()}
                    </Button>
                  )) : (
                    <Button variant="default" className="h-7 text-xs">
                      {exercise.type === 'phoneme' ? `/${currentContent}/` : currentContent.toString().toUpperCase()}
                    </Button>
                  )}
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
                    onClick={playPronunciation}
                    variant="outline"
                    size="sm"
                    className="bg-white h-8 text-xs justify-start"
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    Hear Word
                  </Button>
                  
                  <Button
                    onClick={playPronunciation}
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
                  
                  {/* Test Controls */}
                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      onClick={testPhoneme}
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs mb-2 bg-blue-600 hover:bg-blue-700"
                      disabled={isRecording || isProcessing}
                    >
                      <Mic className="w-3 h-3 mr-1" />
                      Test Phoneme
                    </Button>
                    
                    <Button
                      onClick={testWord}
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                      disabled={isRecording || isProcessing || isLooping}
                    >
                      <Play className="w-3 h-3 mr-1" />
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
                        {exercise.type === 'phoneme' ? currentContent : 
                         targetPhonemes[currentPhonemeIndex] || currentContent.toString().charAt(0)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Animated Lips */}
                  <div className="flex-1 flex items-center justify-center">
                    <AnimatedLips
                      phoneme={exercise.type === 'phoneme' ? currentContent.toString() : 
                               targetPhonemes[currentPhonemeIndex] || currentContent.toString().charAt(0)}
                      isAnimating={isAnimating}
                      className="max-w-full max-h-full"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Side Panel - Camera & Analysis */}
          <div className="lg:col-span-1 h-full">
            <Card className="p-4 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Practice & Analysis</h3>
              
              {/* Camera Feed */}
              <div className="mb-4">
                <CameraWindow 
                  isActive={isCameraActive}
                  className="w-full h-32 mb-2"
                />
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-xs text-red-600">Live Video Feed</span>
                </div>
              </div>

              {/* Sound Waveform */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Sound Waveform</h4>
                <div className="bg-green-100 h-12 rounded flex items-center justify-center mb-2">
                  {isRecording ? (
                    <div className="flex space-x-1">
                      {[...Array(15)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-green-500 rounded animate-pulse"
                          style={{ 
                            height: `${Math.random() * 30 + 5}px`,
                            animationDelay: `${i * 0.1}s` 
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-green-600">Ready to record</span>
                  )}
                </div>
                
                {/* Listen to Recorded Audio Button */}
                {lastRecordedAudio && (
                  <Button
                    onClick={() => {
                      const audioUrl = URL.createObjectURL(lastRecordedAudio);
                      const audio = new Audio(audioUrl);
                      audio.play().catch(console.error);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    Listen to Recording
                  </Button>
                )}
              </div>

              {/* Scoring */}
              <div className="space-y-3 flex-1">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-blue-600">Lip Shape Match</span>
                    <span className="text-xs text-blue-600">{lipShapeMatch}%</span>
                  </div>
                  <Progress value={lipShapeMatch} className="h-2" />
                </div>

                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-green-600">Sound Match</span>
                    <span className="text-xs text-green-600">{soundMatch}%</span>
                  </div>
                  <Progress value={soundMatch} className="h-2" />
                  {recognitionResult && (
                    <div className="text-xs text-green-700 mt-1">
                      "{recognitionResult}"
                    </div>
                  )}
                </div>

                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-sm font-semibold text-purple-600 mb-1">Overall Score</div>
                  <div className="text-2xl font-bold text-purple-600">{overallScore}</div>
                  <div className="text-xs text-gray-600">Points</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>


      {/* Score Display */}
      {showScore && (
        <div className="mt-6">
          <ScoreCard
            score={scores[currentIndex] || 0}
            targetWord={currentContent.toString()}
            spokenWord={spokenWords[currentIndex] || ''}
            onRetry={handleRetry}
            onNext={currentIndex < totalItems - 1 ? handleNext : undefined}
          />
          
          {currentIndex === totalItems - 1 && (
            <div className="text-center mt-4">
              <Button onClick={handleNext} size="lg" className="bg-green-500 hover:bg-green-600">
                Complete Exercise
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExerciseView;