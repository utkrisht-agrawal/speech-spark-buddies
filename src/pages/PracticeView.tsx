
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
import { CURRICULUM_LEVELS } from '@/data/curriculum';
import { useDetailedProgress } from '@/hooks/useDetailedProgress';
import { useAuth } from '@/hooks/useAuth';
import ExercisePlayer from '@/components/ExercisePlayer';

const PracticeView = () => {
  const { user } = useAuth();
  const { exerciseProgress, levelProgress, loading, refreshProgress } = useDetailedProgress();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      refreshProgress();
    }
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProgress();
    setRefreshing(false);
  };

  const handleStartExercise = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleExerciseComplete = () => {
    setSelectedExercise(null);
    // Refresh progress after completing exercise
    setTimeout(() => {
      refreshProgress();
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

  if (loading) {
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

        {/* Exercises by Level */}
        <div className="space-y-6">
          {CURRICULUM_LEVELS.map(level => (
            <Card key={level.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                      {level.id}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{level.name}</CardTitle>
                      <p className="text-sm text-gray-600">{level.ageRange}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Level Progress</div>
                    <div className="text-lg font-semibold">
                      {levelProgress[level.id]?.completion_percentage || 0}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {level.exercises.map(exercise => {
                    const progress = exerciseProgress[exercise.id];
                    const hasProgress = progress && progress.items.some(item => item.attempts > 0);
                    
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
                          <div className="text-sm text-gray-500">
                            {hasProgress ? (
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>Progress: {progress.completion_percentage}%</span>
                                  <span>Best Score: {progress.overall_best_score}%</span>
                                </div>
                                <Progress value={progress.completion_percentage} className="h-1" />
                              </div>
                            ) : (
                              <div className="text-orange-600">Not attempted</div>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleStartExercise(exercise)}
                          className="ml-4"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PracticeView;
