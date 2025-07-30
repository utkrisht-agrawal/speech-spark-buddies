import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft,
  Volume2, 
  Mic, 
  CheckCircle, 
  XCircle,
  Star,
  Home,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CameraWindow } from '@/components/CameraWindow';
import AnimatedLips from '@/components/AnimatedLips';
import { AdvancedSpeechRecognition } from '@/utils/speechRecognition';
import { useDetailedProgress } from '@/hooks/useDetailedProgress';
import { CURRICULUM_LEVELS } from '@/data/curriculum';

interface ExerciseData {
  id: string;
  title: string;
  type: 'phoneme' | 'word' | 'sentence';
  difficulty: 1 | 2 | 3;
  points: number;
  requiredAccuracy: number;
  instruction: string;
  content: any[];
  level?: number;
}

interface ExercisePlayerProps {
  exercise: ExerciseData;
  onComplete: () => void;
  onExit: () => void;
}

const ExercisePlayer: React.FC<ExercisePlayerProps> = ({ exercise, onComplete, onExit }) => {
  const { recordItemProgress, updateLevelProgress, levelConfigs } = useDetailedProgress();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [showScore, setShowScore] = useState(false);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [speechRecognition] = useState(() => new AdvancedSpeechRecognition());
  const [lipShapeMatch, setLipShapeMatch] = useState(75);
  const [soundMatch, setSoundMatch] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState('Normal');
  const [recognitionResult, setRecognitionResult] = useState<string>("");
  const [lastRecordedAudio, setLastRecordedAudio] = useState<Blob | null>(null);

  const currentItem = exercise.content[currentIndex];
  const isLastItem = currentIndex === exercise.content.length - 1;
  const progress = ((currentIndex + 1) / exercise.content.length) * 100;

  useEffect(() => {
    // Calculate overall score from current scores
    if (scores.length > 0) {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      setOverallScore(Math.round(avgScore));
    }
  }, [scores]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setIsProcessing(true);
      setHasRecorded(false);
      setShowScore(false);
      
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
        const currentText = getExpectedText(currentItem);
        const wordCount = currentText.split(' ').length;
        recordingDuration = wordCount * 2000; // 2 seconds per word for sentences
      }

      setTimeout(async () => {
        if (speechRecognition.isRecording()) {
          const audioBlob = await speechRecognition.stopRecording();
          clearInterval(interval);
          setIsRecording(false);
          setLastRecordedAudio(audioBlob);
          
          // Process with backend
          const target = getExpectedText(currentItem);
          console.log(`🎯 Processing target: "${target}"`);
          
          try {
            const result = await speechRecognition.recognizeSpeech(audioBlob, target);
            console.log(`🗣️ Backend result:`, result);
            
            setSoundMatch(result.similarityScore);
            setRecognitionResult(result.transcription);
            setHasRecorded(true);
            setShowScore(true);
            setIsProcessing(false);
            
            // Store results
            setUserResponses(prev => {
              const newSpoken = [...prev];
              newSpoken[currentIndex] = result.transcription;
              return newSpoken;
            });
            
            setScores(prev => {
              const newScores = [...prev];
              newScores[currentIndex] = result.similarityScore;
              return newScores;
            });

            // Simulate lip shape match
            const mockLipScore = Math.floor(Math.random() * 30) + 70;
            setLipShapeMatch(mockLipScore);

            // Record individual item progress
            await recordItemProgress(
              exercise.id,
              exercise.level || 1,
              currentIndex,
              target,
              result.similarityScore
            );
            
          } catch (error) {
            console.error('Error with backend recording:', error);
            setSoundMatch(0);
            setRecognitionResult('Recognition failed');
            setIsProcessing(false);
            setHasRecorded(true);
            setShowScore(true);
          }
        }
      }, recordingDuration);
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setIsProcessing(false);
      toast.error('Could not start recording');
    }
  };

  const getExpectedText = (item: any): string => {
    switch (exercise.type) {
      case 'phoneme':
        return item.character;
      case 'word':
        return item.word;
      case 'sentence':
        return item.sentence;
      default:
        return '';
    }
  };

  const handleRetry = () => {
    setHasRecorded(false);
    setShowScore(false);
    setSoundMatch(0);
    setLipShapeMatch(75);
    setRecognitionResult('');
  };

  const handleNext = () => {
    if (currentIndex < exercise.content.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setHasRecorded(false);
      setShowScore(false);
      setSoundMatch(0);
      setLipShapeMatch(75);
      setRecognitionResult('');
    } else {
      finishExercise();
    }
  };

  const nextItem = () => {
    if (currentIndex < exercise.content.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHasRecorded(false);
      setShowScore(false);
      setSoundMatch(0);
      setLipShapeMatch(75);
      setRecognitionResult('');
    }
  };

  const previousItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setHasRecorded(false);
      setShowScore(false);
      setSoundMatch(0);
      setLipShapeMatch(75);
      setRecognitionResult('');
    }
  };

  const finishExercise = async () => {
    const totalAccuracy = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const requiredAccuracy = levelConfigs[exercise.level || 1]?.pass_score || exercise.requiredAccuracy;
    const passed = totalAccuracy >= requiredAccuracy;
    
    console.log('🎯 Finishing exercise:', {
      exerciseId: exercise.id,
      totalAccuracy,
      requiredAccuracy,
      passed,
      scores
    });
    
    try {
      // Save progress to database
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user) {
        const progressRecord = {
          user_id: userData.user.id,
          exercise_id: exercise.id,
          exercise_type: exercise.type,
          score: Math.round(totalAccuracy),
          accuracy: Math.round(totalAccuracy),
          xp_earned: passed ? exercise.points : Math.round(exercise.points * 0.5)
        };
        
        console.log('💾 Saving progress record:', progressRecord);
        
        const { data, error } = await supabase
          .from('user_progress')
          .insert(progressRecord);
          
        if (error) {
          console.error('❌ Database error:', error);
          throw error;
        }

        // Update level progress - calculate proper totals
        const levelId = exercise.level || 1;
        
        // Get all exercises for this level to calculate proper progress
        const levelData = CURRICULUM_LEVELS.find(level => level.id === levelId);
        const totalExercisesInLevel = levelData?.exercises.length || 1;
        
        // Get current exercise progress for this level
        const { data: levelExercises } = await supabase
          .from('exercise_progress')
          .select('exercise_id, user_id, best_score')
          .eq('user_id', userData.user.id)
          .eq('level_id', levelId);
        
        // Calculate unique exercises completed and average score
        const uniqueExercises = new Set(levelExercises?.map(ep => ep.exercise_id) || []);
        const completedExercises = uniqueExercises.size;
        
        const averageScore = levelExercises && levelExercises.length > 0 
          ? levelExercises.reduce((sum, ex) => sum + ex.best_score, 0) / levelExercises.length
          : totalAccuracy;
        
        await updateLevelProgress(levelId, totalExercisesInLevel, completedExercises, averageScore);
        
        console.log('✅ Progress saved successfully:', data);
        console.log('📊 Level progress updated:', {
          levelId,
          totalExercisesInLevel,
          completedExercises,
          averageScore
        });
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Error saving your progress');
    }
  };

  const playText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.7;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    }
  };

  const renderContent = () => {
    if (showResults) {
      const totalAccuracy = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const requiredAccuracy = levelConfigs[exercise.level || 1]?.pass_score || exercise.requiredAccuracy;
      const passed = totalAccuracy >= requiredAccuracy;

      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              {passed ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
              <span>{passed ? 'Exercise Completed!' : 'Keep Practicing!'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2 text-blue-600">
                {Math.round(totalAccuracy)}%
              </div>
              <p className="text-gray-600">Overall Accuracy</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <div className="font-semibold">
                  {passed ? exercise.points : Math.round(exercise.points * 0.5)} XP
                </div>
                <div className="text-sm text-gray-600">Points Earned</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="font-semibold">{exercise.content.length}</div>
                <div className="text-sm text-gray-600">Items Completed</div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={onExit} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Button>
              <Button onClick={() => {
                console.log('🚀 Exercise results - calling onComplete to refresh dashboard');
                // Always call onComplete to refresh the dashboard, regardless of pass/fail
                onComplete();
              }} className="flex-1">
                {passed ? 'Continue Learning' : 'Try Again'}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Main exercise interface matching the level-based GUI
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 flex flex-col overflow-hidden max-h-screen">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
          <Button
            onClick={onExit}
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
              {currentIndex + 1} of {exercise.content.length}
            </p>
          </div>

          <div className="flex items-center gap-1 text-sm">
            <div className="text-3xl font-bold text-purple-600">{overallScore}</div>
          </div>
        </div>

        {/* Main Content - Three Column Layout */}
        <div className="flex-1 min-h-0 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full max-h-full">
            
            {/* Left Panel - Controls */}
            <div className="h-full">
              <Card className="p-4 bg-white border-2 border-gray-200 h-full flex flex-col">
                
                {/* Phoneme/Content Selection */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    {exercise.type === 'phoneme' ? 'Phonemes' : 
                     exercise.type === 'word' ? 'Words' : 'Sentences'}
                  </h3>
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {exercise.content.map((item: any, idx: number) => (
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
                        {exercise.type === 'phoneme' && item.character ? `/${item.character}/` : 
                         exercise.type === 'word' && item.word ? item.word :
                         exercise.type === 'sentence' && item.sentence ? item.sentence.split(' ')[0] + '...' :
                         'Item'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Controls</h3>
                  
                  {/* Audio Controls */}
                  <Button
                    onClick={() => playText(getExpectedText(currentItem))}
                    variant="outline"
                    size="sm"
                    className="bg-white h-8 text-xs justify-start"
                    disabled={isRecording}
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    Hear Word
                  </Button>
                  
                  <Button
                    onClick={() => playText(getExpectedText(currentItem))}
                    variant="outline"
                    size="sm"
                    className="bg-white h-8 text-xs justify-start"
                    disabled={isRecording}
                  >
                    🔊 Hear Phoneme
                  </Button>
                  
                  {/* Speed Control */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-600">Speed:</span>
                    <select 
                      className="text-xs border rounded px-2 py-1 bg-white"
                      onChange={(e) => setAnimationSpeed(e.target.value)}
                      value={animationSpeed}
                    >
                      <option value="Slow">Slow</option>
                      <option value="Normal">Normal</option>
                      <option value="Fast">Fast</option>
                    </select>
                  </div>
                  
                  {/* Test Controls */}
                  <div className="pt-2 border-t border-gray-200 mt-auto">
                    <Button
                      onClick={startRecording}
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs mb-2 bg-blue-600 hover:bg-blue-700"
                      disabled={isRecording || isProcessing}
                    >
                      <Mic className="w-3 h-3 mr-1" />
                      {isRecording ? 'Recording...' : 'Test Phoneme'}
                    </Button>
                    
                    <Button
                      onClick={startRecording}
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                      disabled={isRecording || isProcessing}
                    >
                      {isRecording ? 'Recording...' : 'Test Word'}
                    </Button>

                    {hasRecorded && showScore && (
                      <div className="mt-2 space-y-1">
                        <Button
                          onClick={handleRetry}
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                        <Button
                          onClick={handleNext}
                          variant="default"
                          size="sm"
                          className="w-full h-7 text-xs"
                        >
                          {isLastItem ? 'Finish' : 'Next'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Center Panel - Lip Animation Guide */}
            <div className="h-full">
              <Card className="p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-200 h-full flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-200">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {getExpectedText(currentItem)}
                    </h2>
                    <p className="text-xs text-gray-600">
                      Current: {exercise.type === 'phoneme' && currentItem.character ? currentItem.character : 
                               exercise.type === 'word' && currentItem.word ? currentItem.word :
                               exercise.type === 'sentence' && currentItem.sentence ? 'sentence' : 'item'}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      onClick={previousItem}
                      variant="outline"
                      size="sm"
                      disabled={currentIndex === 0}
                      className="h-8 px-2 text-xs"
                    >
                      ← Prev
                    </Button>
                    <Button
                      onClick={nextItem}
                      variant="outline"
                      size="sm"
                      disabled={currentIndex === exercise.content.length - 1}
                      className="h-8 px-2 text-xs"
                    >
                      Next →
                    </Button>
                  </div>
                </div>

                {/* Lip Animation Guide */}
                <div className="bg-white rounded-xl p-4 border border-gray-200 flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Lip Animation Guide</h3>
                  
                  {/* 3D Mouth Animation or Image */}
                  <div className="flex-1 flex items-center justify-center">
                    {exercise.type === 'phoneme' && currentItem.imageUrl ? (
                      <div className="text-center">
                        <img 
                          src={currentItem.imageUrl} 
                          alt={`Mouth position for ${currentItem.character}`}
                          className="w-32 h-32 mx-auto rounded-lg shadow-lg mb-4"
                        />
                        <AnimatedLips 
                          phoneme={currentItem.character} 
                          isAnimating={isRecording}
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                          <span className="text-2xl">👄</span>
                        </div>
                        <div className="text-4xl font-bold text-blue-600">
                          {getExpectedText(currentItem)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="text-center mt-4">
                    <span className="text-sm text-gray-600 flex items-center justify-center">
                      🗣️ {isRecording ? 'Recording...' : 
                           isProcessing ? 'Processing...' :
                           hasRecorded ? `Got: "${recognitionResult}"` :
                           'Ready'}
                    </span>
                    {showScore && (
                      <div className="mt-2 text-xs text-gray-600">
                        Score: {soundMatch}% accuracy
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Panel - Practice & Analysis */}
            <div className="h-full">
              <Card className="p-4 bg-white border-2 border-gray-200 h-full flex flex-col">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Practice & Analysis</h3>
                
                {/* Live Video Feed */}
                <div className="mb-4">
                  <CameraWindow 
                    isActive={isRecording}
                    className="w-full h-32 rounded-lg"
                  />
                  <div className="text-xs text-center text-gray-600 mt-1">
                    🔴 Live Video Feed
                  </div>
                </div>

                {/* Sound Waveform */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Sound Waveform</h4>
                  <div className="h-16 bg-green-50 rounded-lg flex items-center justify-center">
                    {isRecording ? (
                      <div className="flex items-center space-x-1">
                        {audioData.slice(-15).map((_, i) => (
                          <div
                            key={i}
                            className="bg-green-400 rounded-full w-1"
                            style={{
                              height: `${Math.random() * 40 + 10}px`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-green-600">Ready to record</span>
                    )}
                  </div>
                </div>

                {/* Analysis Scores */}
                <div className="space-y-3 flex-1">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Lip Shape Match</span>
                      <span className="text-sm font-semibold text-blue-600">{lipShapeMatch}%</span>
                    </div>
                    <Progress value={lipShapeMatch} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Sound Match</span>
                      <span className="text-sm font-semibold text-green-600">{soundMatch}%</span>
                    </div>
                    <Progress value={soundMatch} className="h-2" />
                  </div>

                  {hasRecorded && recognitionResult && (
                    <div className="bg-gray-50 rounded-lg p-2 mt-2">
                      <div className="text-xs text-gray-600 mb-1">You said:</div>
                      <div className="text-sm font-medium">"{recognitionResult}"</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Target: "{getExpectedText(currentItem)}"
                      </div>
                    </div>
                  )}

                  <div className="text-center mt-6">
                    <div className="text-sm text-gray-600 mb-1">Overall Score</div>
                    <div className="text-4xl font-bold text-purple-600 mb-1">{overallScore}</div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={previousItem}
                    disabled={currentIndex === 0}
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <Button
                    onClick={currentIndex === exercise.content.length - 1 ? finishExercise : handleNext}
                    disabled={isRecording || isProcessing}
                    size="sm"
                  >
                    {currentIndex === exercise.content.length - 1 ? 'Finish' : 'Next'}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return renderContent();
};

export default ExercisePlayer;