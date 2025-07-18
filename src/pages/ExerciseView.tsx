import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, RotateCcw, ChevronRight, Volume2 } from 'lucide-react';
import { Exercise } from '@/types/curriculum';
import AvatarGuide from '@/components/AvatarGuide';
import RecordButton from '@/components/RecordButton';
import ScoreCard from '@/components/ScoreCard';
import { CameraWindow } from '@/components/CameraWindow';

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

  const isArrayContent = Array.isArray(exercise.content);
  const currentContent = isArrayContent ? exercise.content[currentIndex] : exercise.content;
  const totalItems = isArrayContent ? exercise.content.length : 1;
  const progress = ((currentIndex + 1) / totalItems) * 100;

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    
    if (!isRecording) {
      // Start recording
      setTimeout(() => {
        // Simulate speech recognition
        setIsRecording(false);
        setHasRecorded(true);
        
        // Mock speech-to-text result
        const mockSpoken = generateMockSpokenText(currentContent.toString());
        const mockScore = calculateMockScore(currentContent.toString(), mockSpoken);
        
        setSpokenWords(prev => {
          const newSpoken = [...prev];
          newSpoken[currentIndex] = mockSpoken;
          return newSpoken;
        });
        
        setScores(prev => {
          const newScores = [...prev];
          newScores[currentIndex] = mockScore;
          return newScores;
        });
        
        setShowScore(true);
      }, 2000);
    }
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

  const renderExerciseContent = () => {
    switch (exercise.type) {
      case 'phoneme':
        return (
          <div className="text-center">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              /{currentContent}/
            </div>
            <p className="text-lg text-gray-600">
              Say this phoneme sound clearly
            </p>
          </div>
        );

      case 'word':
        return (
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-4 uppercase">
              {currentContent}
            </div>
            <div className="w-32 h-32 bg-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📷</span>
            </div>
            <p className="text-lg text-gray-600">
              Say this word clearly
            </p>
          </div>
        );

      case 'sentence':
        return (
          <div className="text-center">
            <div className="text-2xl font-semibold text-purple-600 mb-4 leading-relaxed">
              "{currentContent}"
            </div>
            <p className="text-lg text-gray-600">
              Say this sentence with proper rhythm and pauses
            </p>
          </div>
        );

      case 'conversation':
        return (
          <div className="text-center">
            <div className="bg-blue-50 p-4 rounded-xl mb-4">
              <div className="text-lg font-medium text-blue-800 mb-2">
                Conversation Practice
              </div>
              <div className="text-xl text-blue-700">
                "{currentContent}"
              </div>
            </div>
            <p className="text-lg text-gray-600">
              Say this as if you're having a real conversation
            </p>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <div className="text-xl text-gray-700 mb-4">
              {currentContent}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-purple-800">{exercise.title}</h1>
            <p className="text-gray-600">{exercise.instruction}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {exercise.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {exercise.points} XP
            </Badge>
          </div>
        </div>

        {/* Progress */}
        {isArrayContent && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-gray-600">
                  {currentIndex + 1} of {totalItems}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Exercise Content */}
        <Card className="mb-6">
          <CardContent className="p-8">
            {renderExerciseContent()}
            
            {/* Play Pronunciation Button */}
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={playPronunciation}
                className="mb-6"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Hear Pronunciation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Avatar Guide and Camera */}
        <div className="flex justify-center mb-6">
          <div className="flex gap-4 justify-center items-start">
            <AvatarGuide
              isListening={isRecording}
              mood={showScore ? 'celebrating' : 'encouraging'}
              message={
                isRecording ? "I'm listening..." :
                showScore ? "Great job!" :
                "Press the microphone when ready!"
              }
            />
            <CameraWindow 
              isActive={isRecording}
              className="w-80 h-60"
            />
          </div>
        </div>

        {/* Recording Interface */}
        {!showScore && (
          <div className="text-center mb-6">
            <RecordButton
              isRecording={isRecording}
              onToggleRecording={handleToggleRecording}
            />
            
            {isRecording && (
              <div className="mt-4 flex justify-center">
                <div className="flex space-x-1">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-8 bg-red-400 rounded animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Score Display */}
        {showScore && (
          <div className="mb-6">
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

        {/* Exercise Info */}
        <Card className="bg-yellow-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-yellow-700">Difficulty</div>
                <div className="flex justify-center mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full mx-1 ${
                        i < exercise.difficulty ? 'bg-yellow-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-700">Target Accuracy</div>
                <div className="text-yellow-600">{exercise.requiredAccuracy}%</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-700">Reward</div>
                <div className="text-yellow-600">{exercise.points} XP</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExerciseView;