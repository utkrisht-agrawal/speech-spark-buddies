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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Today's Practice</h2>
        <p className="text-gray-600">Complete your daily exercises to build your skills</p>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-bold text-gray-800">Daily Progress</h3>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <span>{completedToday}/{exercises.length}</span>
            <CheckCircle className="w-4 h-4" />
          </Badge>
        </div>
        {exercises.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progress</span>
              <span>{Math.round((completedToday / exercises.length) * 100)}%</span>
            </div>
            <Progress value={(completedToday / exercises.length) * 100} className="h-3" />
          </div>
        )}
      </div>

      {exercises.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-700 mb-2">No exercises assigned yet</h3>
          <p className="text-gray-500">Your therapist will assign exercises for you to practice.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => (
            <div 
              key={exercise.id} 
              className={`bg-white rounded-3xl p-6 shadow-xl border transition-all duration-200 hover:shadow-2xl ${
                exercise.completed 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-100 hover:border-purple-200'
              }`}
            >
              {/* Exercise Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">{getTypeIcon(exercise.type)}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{exercise.title}</h3>
                <p className="text-sm text-gray-600">{exercise.instruction}</p>
              </div>

              {/* Exercise Stats */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Points</span>
                  </div>
                  <span className="font-semibold text-gray-800">{exercise.points}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Required</span>
                  </div>
                  <span className="font-semibold text-gray-800">{exercise.requiredAccuracy}%</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-600">Level</span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getDifficultyColor(exercise.difficulty)}
                  >
                    {exercise.difficulty === 1 ? 'Easy' : exercise.difficulty === 2 ? 'Medium' : 'Hard'}
                  </Badge>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center">
                {exercise.completed ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-semibold">Completed!</span>
                    </div>
                    {exercise.accuracy && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {exercise.accuracy}% accuracy
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Button 
                    onClick={() => startExercise(exercise)}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Practice
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyExerciseSection;