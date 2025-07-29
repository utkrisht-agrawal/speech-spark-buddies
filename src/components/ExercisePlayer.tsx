import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Mic, 
  MicOff, 
  Volume2, 
  CheckCircle, 
  XCircle,
  Star,
  Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

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
    if (!currentItem) return null;

    switch (exercise.type) {
      case 'phoneme':
        return (
          <div className="text-center space-y-6">
            {currentItem.imageUrl && (
              <div className="mb-6">
                <img 
                  src={currentItem.imageUrl} 
                  alt={`Mouth position for ${currentItem.character}`}
                  className="w-32 h-32 mx-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {currentItem.character}
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Say this phoneme sound clearly
            </p>
          </div>
        );

      case 'word':
        return (
          <div className="text-center space-y-6">
            <div className="text-4xl font-bold text-green-600 mb-4">
              {currentItem.word}
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {currentItem.phonemes?.map((phoneme: any, idx: number) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  {phoneme.character}
                </Badge>
              ))}
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Say this word clearly
            </p>
          </div>
        );

      case 'sentence':
        return (
          <div className="text-center space-y-6">
            <div className="text-2xl font-semibold text-purple-600 mb-4 leading-relaxed">
              "{currentItem.sentence}"
            </div>
            <div className="space-y-2 mb-6">
              {currentItem.words?.map((word: any, idx: number) => (
                <div key={idx} className="flex items-center justify-center space-x-2">
                  <span className="font-medium text-gray-700">{word.word}:</span>
                  <div className="flex gap-1">
                    {word.phonemes?.map((phoneme: any, pIdx: number) => (
                      <Badge key={pIdx} variant="outline" className="text-xs">
                        {phoneme.character}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Read this sentence clearly
            </p>
          </div>
        );

      default:
        return null;
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{exercise.title}</h1>
                <p className="text-gray-600">{exercise.instruction}</p>
              </div>
              <Button variant="outline" onClick={onExit}>
                <Home className="w-4 h-4 mr-2" />
                Exit
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress: {currentIndex + 1} of {exercise.content.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Exercise Content */}
        <Card>
          <CardContent className="p-8">
            {renderContent()}
            
            {/* Controls */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button
                variant="outline"
                onClick={() => playText(getExpectedText(currentItem))}
                disabled={isRecording}
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Listen
              </Button>
              
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!mediaRecorder}
                size="lg"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={previousItem}
                disabled={currentIndex === 0}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="text-center">
                <Badge variant="secondary" className="px-3 py-1">
                  {exercise.type.charAt(0).toUpperCase() + exercise.type.slice(1)} Exercise
                </Badge>
              </div>

              <Button
                onClick={isLastItem ? finishExercise : nextItem}
                disabled={isRecording}
              >
                {isLastItem ? 'Finish' : 'Next'}
                <Play className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Responses */}
        {userResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userResponses.map((response, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span>"{response}"</span>
                    <Badge variant={scores[idx] >= exercise.requiredAccuracy ? "default" : "secondary"}>
                      {scores[idx]}%
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExercisePlayer;