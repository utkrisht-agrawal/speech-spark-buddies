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

interface ExerciseData {
  id: string;
  title: string;
  type: 'phoneme' | 'word' | 'sentence';
  difficulty: 1 | 2 | 3;
  points: number;
  requiredAccuracy: number;
  instruction: string;
  content: any[];
}

interface ExercisePlayerProps {
  exercise: ExerciseData;
  onComplete: () => void;
  onExit: () => void;
}

const ExercisePlayer: React.FC<ExercisePlayerProps> = ({ exercise, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [lipShapeMatch, setLipShapeMatch] = useState(0);
  const [soundMatch, setSoundMatch] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState('Normal');

  const currentItem = exercise.content[currentIndex];
  const isLastItem = currentIndex === exercise.content.length - 1;
  const progress = ((currentIndex + 1) / exercise.content.length) * 100;

  useEffect(() => {
    setupAudioRecording();
    return () => {
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    };
  }, []);

  const setupAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        setAudioChunks(prev => [...prev, event.data]);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processRecording(audioBlob);
        setAudioChunks([]);
      };
      
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Error setting up audio recording:', error);
      toast.error('Could not access microphone');
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Send to speech recognition edge function
        const { data, error } = await supabase.functions.invoke('speech-recognition', {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        const transcription = data.text || '';
        const expectedText = getExpectedText(currentItem);
        const accuracy = calculateAccuracy(transcription, expectedText);
        
        setUserResponses(prev => [...prev, transcription]);
        setScores(prev => [...prev, accuracy]);
        
        toast.success(`Accuracy: ${accuracy}%`);
        
        // Auto-advance after recording
        setTimeout(() => {
          if (isLastItem) {
            finishExercise();
          } else {
            nextItem();
          }
        }, 1500);
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error('Error processing your recording');
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

  const calculateAccuracy = (spoken: string, expected: string): number => {
    if (!spoken || !expected) return 0;
    
    const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
    const expectedWords = expected.toLowerCase().trim().split(/\s+/);
    
    if (expectedWords.length === 0) return 0;
    
    let matches = 0;
    expectedWords.forEach(word => {
      if (spokenWords.includes(word)) {
        matches++;
      }
    });
    
    return Math.round((matches / expectedWords.length) * 100);
  };

  const finishExercise = async () => {
    const totalAccuracy = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const passed = totalAccuracy >= exercise.requiredAccuracy;
    
    try {
      // Save progress to database
      const { data: userData } = await supabase.auth.getUser();
      
      if (userData.user) {
        await supabase.from('user_progress').insert({
          user_id: userData.user.id,
          exercise_id: exercise.id,
          exercise_type: exercise.type,
          score: Math.round(totalAccuracy),
          accuracy: Math.round(totalAccuracy),
          xp_earned: passed ? exercise.points : Math.round(exercise.points * 0.5)
        });
      }
      
      setShowResults(true);
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Error saving your progress');
    }
  };

  const startRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'inactive') {
      setAudioChunks([]);
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const nextItem = () => {
    if (currentIndex < exercise.content.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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
      const passed = totalAccuracy >= exercise.requiredAccuracy;

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
              <Button onClick={onComplete} className="flex-1">
                Continue Learning
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Main exercise interface matching the level-based GUI
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 flex flex-col overflow-hidden">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3 px-2">
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
        <div className="flex-1 max-w-full mx-auto overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
            
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
                      Test Phoneme
                    </Button>
                    
                    <Button
                      onClick={startRecording}
                      variant="default"
                      size="sm"
                      className="w-full h-8 text-xs bg-green-600 hover:bg-green-700"
                      disabled={isRecording || isProcessing}
                    >
                      Test Word
                    </Button>
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
                      🗣️ {isRecording ? 'Recording...' : 'Ready'}
                    </span>
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
                    onClick={currentIndex === exercise.content.length - 1 ? finishExercise : nextItem}
                    disabled={isRecording}
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