
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Play, 
  Lock, 
  Trophy, 
  Target, 
  Book,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDetailedProgress } from '@/hooks/useDetailedProgress';
import { useAuth } from '@/hooks/useAuth';
import ExercisePlayer from '@/components/ExercisePlayer';

const PracticeView = () => {
  const { user } = useAuth();
  const { exerciseProgress, levelProgress, loading, refreshProgress } = useDetailedProgress();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [loadingExercises, setLoadingExercises] = useState(true);

  // Fetch actual exercises from database
  const fetchExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      
      if (error) throw error;
      
      console.log('📚 Fetched exercises:', data);
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchExercises();
      refreshProgress();
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchExercises(), refreshProgress()]);
    setRefreshing(false);
  };

  const handleStartExercise = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleExerciseComplete = () => {
    setSelectedExercise(null);
    // Refresh progress after completing exercise
    setTimeout(() => {
      Promise.all([fetchExercises(), refreshProgress()]);
    }, 1000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardTitle className="mb-4">Please Log In</CardTitle>
          <p className="text-gray-600">You need to be logged in to access practice exercises.</p>
        </Card>
      </div>
    );
  }

  if (selectedExercise) {
    return (
      <ExercisePlayer
        exercise={selectedExercise}
        onComplete={handleExerciseComplete}
        onExit={() => setSelectedExercise(null)}
      />
    );
  }

  if (loading || loadingExercises) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exercises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-purple-800">Practice Exercises</h1>
              <p className="text-gray-600">Master speech sounds through targeted practice</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* All Available Exercises */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Book className="w-5 h-5 mr-2" />
                Practice Exercises
              </CardTitle>
              <div className="text-sm text-gray-600">
                Total: {exercises.length} exercises
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Book className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No exercises available yet.</p>
                <p className="text-sm">Ask your therapist to create some exercises for you!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map(exercise => {
                  const progress = exerciseProgress[exercise.id];
                  const hasProgress = progress && progress.items.some(item => item.attempts > 0);
                  
                  console.log(`🔍 Exercise ${exercise.id}:`, {
                    progress,
                    hasProgress,
                    exerciseProgressKeys: Object.keys(exerciseProgress)
                  });
                  
                  return (
                    <div 
                      key={exercise.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{exercise.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {exercise.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {exercise.points} XP
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{exercise.instruction}</p>
                        
                        {/* Progress Information */}
                        <div className="text-sm">
                          {hasProgress ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-green-600">
                                <span>✅ Progress: {progress.completion_percentage}%</span>
                                <span>Best Score: {progress.overall_best_score}%</span>
                              </div>
                              <Progress value={progress.completion_percentage} className="h-2" />
                              <div className="text-xs text-gray-500">
                                Attempts: {progress.items.reduce((sum, item) => sum + item.attempts, 0)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-orange-600 font-medium">
                              📝 Not attempted
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleStartExercise({
                          ...exercise,
                          content: exercise.content || []
                        })}
                        className="ml-4"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PracticeView;
