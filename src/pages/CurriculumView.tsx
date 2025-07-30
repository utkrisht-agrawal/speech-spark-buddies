import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Star, Play, Trophy, Target, Book } from 'lucide-react';
import { CURRICULUM_LEVELS } from '@/data/curriculum';
import { Level, Exercise } from '@/types/curriculum';
import { useDetailedProgress } from '@/hooks/useDetailedProgress';

interface CurriculumViewProps {
  studentLevel: number;
  onStartExercise: (exercise: Exercise) => void;
  onStartGame: (game: string) => void;
}

const CurriculumView: React.FC<CurriculumViewProps> = ({ 
  studentLevel, 
  onStartExercise,
  onStartGame 
}) => {
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const { levelProgress, exerciseProgress, levelConfigs, loading, refreshProgress } = useDetailedProgress();

  // Refresh progress data when component mounts or when coming back from exercises
  useEffect(() => {
    refreshProgress();
  }, []);

  const handleStartExercise = (exercise: Exercise) => {
    onStartExercise(exercise);
    // Refresh progress when returning from exercise
    setTimeout(() => {
      refreshProgress();
    }, 1000);
  };

  const renderLevelCard = (level: Level) => {
    const isUnlocked = level.id <= studentLevel;
    const isCurrent = level.id === studentLevel;
    const isCompleted = level.id < studentLevel;

    return (
      <Card 
        key={level.id}
        className={`relative cursor-pointer transition-all hover:shadow-lg ${
          isCurrent ? 'ring-2 ring-blue-400 bg-blue-50' :
          isCompleted ? 'bg-green-50' :
          !isUnlocked ? 'bg-gray-100 opacity-60' : 'hover:bg-purple-50'
        }`}
        onClick={() => isUnlocked && setSelectedLevel(level)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                isCompleted ? 'bg-green-500' :
                isCurrent ? 'bg-blue-500' :
                !isUnlocked ? 'bg-gray-400' : 'bg-purple-500'
              }`}>
                {isCompleted ? <Trophy className="w-5 h-5" /> : level.id}
              </div>
              <div>
                <CardTitle className="text-lg">{level.name}</CardTitle>
                <p className="text-sm text-gray-600">{level.ageRange}</p>
              </div>
            </div>
            {!isUnlocked && <Lock className="w-5 h-5 text-gray-400" />}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-3">{level.description}</p>
          
          {/* Progress bar for current level */}
          {isCurrent && (
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{levelProgress[level.id]?.completion_percentage || 0}%</span>
              </div>
              <Progress value={levelProgress[level.id]?.completion_percentage || 0} className="h-2" />
            </div>
          )}

          {/* Level stats */}
          <div className="flex space-x-4 text-xs text-gray-600">
            <span className="flex items-center">
              <Target className="w-3 h-3 mr-1" />
              {level.exercises.length} exercises
            </span>
            <span className="flex items-center">
              <Star className="w-3 h-3 mr-1" />
              {level.games.length} games
            </span>
          </div>

          {/* Phoneme focus */}
          {level.phonemeFocus.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-1">Focus sounds:</p>
              <div className="flex flex-wrap gap-1">
                {level.phonemeFocus.slice(0, 5).map(phoneme => (
                  <Badge key={phoneme} variant="outline" className="text-xs">
                    /{phoneme}/
                  </Badge>
                ))}
                {level.phonemeFocus.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{level.phonemeFocus.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderLevelDetails = (level: Level) => (
    <div className="space-y-6">
      {/* Level Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">{level.name}</h2>
        <p className="text-purple-100 mb-4">{level.description}</p>
        <div className="flex items-center space-x-4 text-sm">
          <span className="bg-white/20 px-3 py-1 rounded-full">
            Age: {level.ageRange}
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full">
            Pass Score: {levelConfigs[level.id]?.pass_score || level.requiredScoreToPass}%
          </span>
        </div>
      </div>

      {/* Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Learning Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {level.goals.map((goal, index) => (
              <li key={index} className="flex items-start">
                <Star className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{goal}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Exercises */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Book className="w-5 h-5 mr-2" />
            Practice Exercises
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {level.exercises.map((exercise) => {
            const progress = exerciseProgress[exercise.id];
            const hasProgress = progress && progress.items.some(item => item.attempts > 0);
            return (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{exercise.title}</h4>
                  <p className="text-sm text-gray-600">{exercise.instruction}</p>
                  <div className="flex items-center mt-1 space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {exercise.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {exercise.points} XP
                    </span>
                    <div className="flex">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full mr-1 ${
                            i < exercise.difficulty ? 'bg-orange-400' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {hasProgress ? (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress: {progress.completion_percentage}%</span>
                        <span>Best: {progress.overall_best_score}%</span>
                        <span>Last: {progress.overall_last_score}%</span>
                      </div>
                      <Progress value={progress.completion_percentage} className="h-1" />
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress: 0%</span>
                        <span>Not attempted</span>
                      </div>
                      <Progress value={0} className="h-1" />
                    </div>
                  )}
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
        </CardContent>
      </Card>

      {/* Games */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Fun Games
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {level.games.map((game, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg hover:from-pink-100 hover:to-purple-100 transition-colors"
            >
              <div>
                <h4 className="font-medium">{game}</h4>
                <p className="text-sm text-gray-600">Interactive learning game</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartGame(game)}
                className="ml-4"
              >
                <Play className="w-4 h-4 mr-1" />
                Play
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        {!selectedLevel ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-purple-800 mb-2">
                Learning Journey
              </h1>
              <p className="text-gray-600">
                Your current level: <strong>Level {studentLevel}</strong>
              </p>
            </div>

            {/* Level Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CURRICULUM_LEVELS.map(renderLevelCard)}
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => setSelectedLevel(null)}
              className="mb-6"
            >
              ← Back to Levels
            </Button>

            {/* Level Details */}
            {renderLevelDetails(selectedLevel)}
          </>
        )}
      </div>
    </div>
  );
};

export default CurriculumView;