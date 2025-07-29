import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Star, Target, Play, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ExercisePlayer from './ExercisePlayer';

interface DailyExercise {
  id: string;
  title: string;
  type: 'phoneme' | 'word' | 'sentence';
  difficulty: 1 | 2 | 3;
  points: number;
  requiredAccuracy: number;
  instruction: string;
  content: any;
  completed: boolean;
  accuracy?: number;
}

interface DailyExerciseSectionProps {
  userId: string;
}

const DailyExerciseSection: React.FC<DailyExerciseSectionProps> = ({ userId }) => {
  const [exercises, setExercises] = useState<DailyExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);
  const [currentExercise, setCurrentExercise] = useState<DailyExercise | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    fetchDailyExercises();
  }, [userId]);

  const fetchDailyExercises = async () => {
    try {
      setLoading(true);
      
      // Get exercises assigned to this student
      const { data: assignments, error: assignmentError } = await supabase
        .from('exercise_assignments')
        .select(`
          exercise_id,
          exercises (
            id,
            title,
            type,
            difficulty,
            points,
            required_accuracy,
            instruction,
            content
          )
        `)
        .eq('assigned_to', userId)
        .eq('is_active', true);

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        toast.error('Failed to load assignments');
        return;
      }

      // Get today's progress
      const today = new Date().toISOString().split('T')[0];
      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('exercise_id, accuracy')
        .eq('user_id', userId)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
      }

      // Map exercises with completion status
        const exercisesWithProgress = assignments?.map(assignment => {
        const exercise = assignment.exercises;
        const progress = progressData?.find(p => p.exercise_id === exercise.id);
        
        return {
          id: exercise.id,
          title: exercise.title,
          type: exercise.type as 'phoneme' | 'word' | 'sentence',
          difficulty: exercise.difficulty as 1 | 2 | 3,
          points: exercise.points,
          requiredAccuracy: exercise.required_accuracy,
          instruction: exercise.instruction,
          content: exercise.content,
          completed: !!progress,
          accuracy: progress?.accuracy || 0
        };
      }) || [];

      setExercises(exercisesWithProgress);
      setCompletedToday(exercisesWithProgress.filter(ex => ex.completed).length);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const startExercise = (exercise: DailyExercise) => {
    setCurrentExercise(exercise);
    setShowPlayer(true);
  };

  const handleExerciseComplete = () => {
    setShowPlayer(false);
    setCurrentExercise(null);
    fetchDailyExercises(); // Refresh the exercises to show updated completion status
  };

  const handleExerciseExit = () => {
    setShowPlayer(false);
    setCurrentExercise(null);
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-green-100 text-green-800 border-green-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'phoneme': return '🗣️';
      case 'word': return '📝';
      case 'sentence': return '💬';
      default: return '📚';
    }
  };

  if (showPlayer && currentExercise) {
    return (
      <ExercisePlayer
        exercise={{
          id: currentExercise.id,
          title: currentExercise.title,
          type: currentExercise.type,
          difficulty: currentExercise.difficulty,
          points: currentExercise.points,
          requiredAccuracy: currentExercise.requiredAccuracy,
          instruction: currentExercise.instruction,
          content: Array.isArray(currentExercise.content) ? currentExercise.content : []
        }}
        onComplete={handleExerciseComplete}
        onExit={handleExerciseExit}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Today's Exercises</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Today's Exercises</span>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <span>{completedToday}/{exercises.length}</span>
            <CheckCircle className="w-4 h-4" />
          </Badge>
        </CardTitle>
        {exercises.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round((completedToday / exercises.length) * 100)}%</span>
            </div>
            <Progress value={(completedToday / exercises.length) * 100} className="h-2" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {exercises.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No exercises assigned yet</h3>
            <p className="text-gray-500">Your therapist will assign exercises for you to practice.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map((exercise) => (
              <div 
                key={exercise.id} 
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  exercise.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTypeIcon(exercise.type)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800">{exercise.title}</h3>
                      <p className="text-sm text-gray-600">{exercise.instruction}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {exercise.completed ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {exercise.accuracy}% accuracy
                        </Badge>
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    ) : (
                      <Button 
                        onClick={() => startExercise(exercise)}
                        size="sm"
                        className="flex items-center space-x-1"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant="outline" 
                      className={getDifficultyColor(exercise.difficulty)}
                    >
                      {exercise.difficulty === 1 ? 'Easy' : exercise.difficulty === 2 ? 'Medium' : 'Hard'}
                    </Badge>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{exercise.points} points</span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Target className="w-4 h-4 text-blue-500" />
                      <span>{exercise.requiredAccuracy}% required</span>
                    </div>
                  </div>
                  
                  {exercise.type === 'phoneme' && (
                    <div className="text-xs text-gray-500">
                      {Array.isArray(exercise.content) ? exercise.content.length : 0} phonemes
                    </div>
                  )}
                  {exercise.type === 'word' && (
                    <div className="text-xs text-gray-500">
                      {Array.isArray(exercise.content) ? exercise.content.length : 0} words
                    </div>
                  )}
                  {exercise.type === 'sentence' && (
                    <div className="text-xs text-gray-500">
                      {Array.isArray(exercise.content) ? exercise.content.length : 0} sentences
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyExerciseSection;