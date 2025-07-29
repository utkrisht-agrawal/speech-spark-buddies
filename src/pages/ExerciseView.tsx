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
import { VisemeGuide } from '@/components/VisemeGuide';
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

  const isArrayContent = Array.isArray(exercise.content);
  const currentContent = isArrayContent ? exercise.content[currentIndex] : exercise.content;
  const totalItems = isArrayContent ? exercise.content.length : 1;
  const progress = ((currentIndex + 1) / totalItems) * 100;

  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        setIsRecording(true);
        setIsProcessing(false);
        
        await speechRecognition.startRecording();
        
      } catch (error) {
        console.error('Recording failed:', error);
        setIsRecording(false);
        setIsProcessing(false);
      }
    } else {
      try {
        setIsRecording(false);
        setIsProcessing(true);
        
        const audioBlob = await speechRecognition.stopRecording();
        
        // Process with speech recognition
        const targetPhonemes = exercise.targetPhonemes || [];
        const recognitionResult = await speechRecognition.recognizeSpeech(
          audioBlob, 
          targetPhonemes.join(' ')
        );
        
        setIsProcessing(false);
        setHasRecorded(true);
        
        // Store results
        setSpokenWords(prev => {
          const newSpoken = [...prev];
          newSpoken[currentIndex] = recognitionResult.transcription;
          return newSpoken;
        });
        
        setScores(prev => {
          const newScores = [...prev];
          newScores[currentIndex] = recognitionResult.similarityScore;
          return newScores;
        });
        
        setShowScore(true);
      } catch (error) {
        console.error('Processing failed:', error);
        setIsRecording(false);
        setIsProcessing(false);
      }
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
    const targetPhonemes = exercise.targetPhonemes || [];
    const currentPhonemes = exercise.type === 'phoneme' 
      ? [currentContent.toString()]
      : targetPhonemes;

    switch (exercise.type) {
      case 'phoneme':
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              /{currentContent}/
            </div>
            <p className="text-lg text-gray-600">
              Say this phoneme sound clearly
            </p>
            
            {/* Viseme Guide for phoneme */}
            <div className="flex justify-center">
              <VisemeGuide
                word={currentContent.toString()}
                phonemes={currentPhonemes}
                className="max-w-md"
              />
            </div>
          </div>
        );

      case 'word':
        return (
          <div className="text-center space-y-6">
            <div className="text-4xl font-bold text-green-600 mb-4 uppercase">
              {currentContent}
            </div>
            <div className="w-32 h-32 bg-gray-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📷</span>
            </div>
            <p className="text-lg text-gray-600">
              Say this word clearly
            </p>
            
            {/* Viseme Guide for word */}
            <div className="flex justify-center">
              <VisemeGuide
                word={currentContent.toString()}
                phonemes={currentPhonemes}
                className="max-w-md"
              />
            </div>
          </div>
        );

      case 'sentence':
        return (
          <div className="text-center space-y-6">
            <div className="text-2xl font-semibold text-purple-600 mb-4 leading-relaxed">
              "{currentContent}"
            </div>
            <p className="text-lg text-gray-600">
              Say this sentence with proper rhythm and pauses
            </p>
            
            {/* Viseme Guide for sentence */}
            {currentPhonemes.length > 0 && (
              <div className="flex justify-center">
                <VisemeGuide
                  word={currentContent.toString()}
                  phonemes={currentPhonemes}
                  className="max-w-md"
                />
              </div>
            )}
          </div>
        );

      case 'conversation':
        return (
          <div className="text-center space-y-6">
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
            
            {/* Viseme Guide for conversation */}
            {currentPhonemes.length > 0 && (
              <div className="flex justify-center">
                <VisemeGuide
                  word={currentContent.toString()}
                  phonemes={currentPhonemes}
                  className="max-w-md"
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-center space-y-6">
            <div className="text-xl text-gray-700 mb-4">
              {currentContent}
            </div>
            
            {/* Viseme Guide for other types */}
            {currentPhonemes.length > 0 && (
              <div className="flex justify-center">
                <VisemeGuide
                  word={currentContent.toString()}
                  phonemes={currentPhonemes}
                  className="max-w-md"
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-purple-800">{exercise.title}</h1>
            <div className="text-sm text-gray-600">
              {currentIndex + 1} / {totalItems}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
              ← Prev
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentIndex(Math.min(totalItems - 1, currentIndex + 1))} disabled={currentIndex === totalItems - 1}>
              Next →
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Exercise Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Phonemes/Content Display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {exercise.type === 'phoneme' ? 'Phonemes' : 
                   exercise.type === 'word' ? 'Words' : 
                   exercise.type === 'sentence' ? 'Sentences' : 'Content'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {isArrayContent ? (exercise.content as string[]).map((item, idx) => (
                    <Button
                      key={idx}
                      variant={idx === currentIndex ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentIndex(idx)}
                      className="h-10"
                    >
                      {exercise.type === 'phoneme' ? `/${item}/` : item.toString().toUpperCase()}
                    </Button>
                  )) : (
                    <Button variant="default" className="h-10">
                      {exercise.type === 'phoneme' ? `/${currentContent}/` : currentContent.toString().toUpperCase()}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" onClick={playPronunciation}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Hear Word
                </Button>
                <Button variant="outline" className="w-full" onClick={playPronunciation}>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Hear Phoneme
                </Button>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speed:</label>
                  <select className="w-full p-2 border rounded">
                    <option>Normal</option>
                    <option>Slow</option>
                    <option>Fast</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Test Buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleToggleRecording}
                disabled={isProcessing}
              >
                <Mic className="w-4 h-4 mr-2" />
                {isRecording ? 'Stop Recording' : 'Test Phoneme'}
              </Button>
              <Button 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                onClick={handleToggleRecording}
                disabled={isProcessing}
              >
                <Play className="w-4 h-4 mr-2" />
                Test Word
              </Button>
            </div>
          </div>

          {/* Center Panel - Lip Animation Guide */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  Lip Animation Guide
                  <span className="text-sm font-normal text-blue-600">
                    Current: {exercise.type === 'phoneme' ? currentContent : 
                             exercise.targetPhonemes?.[0] || currentContent.toString().charAt(0)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <VisemeGuide
                  word={currentContent.toString()}
                  phonemes={exercise.type === 'phoneme' 
                    ? [currentContent.toString()]
                    : exercise.targetPhonemes || []}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Practice & Analysis */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Practice & Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <CameraWindow 
                  isActive={isRecording}
                  className="w-full h-48 mb-4"
                />
                <div className="flex items-center justify-center mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-red-600">Live</span>
                </div>
              </CardContent>
            </Card>

            {/* Sound Waveform */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sound Waveform</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-100 h-16 rounded flex items-center justify-center mb-2">
                  {isRecording ? (
                    <div className="flex space-x-1">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-green-500 rounded animate-pulse"
                          style={{ 
                            height: `${Math.random() * 40 + 10}px`,
                            animationDelay: `${i * 0.1}s` 
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-green-600">Ready to record</span>
                  )}
                </div>
                {!isRecording && (
                  <div className="flex items-center text-gray-500 text-sm">
                    <Volume2 className="w-4 h-4 mr-2" />
                    No audio recorded
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scoring */}
            <div className="space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-600">Lip Shape Match</span>
                    <span className="text-sm text-blue-600">{lipShapeMatch}%</span>
                  </div>
                  <Progress value={lipShapeMatch} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-green-600">Sound Match</span>
                    <span className="text-sm text-green-600">{soundMatch}%</span>
                  </div>
                  <Progress value={soundMatch} className="h-2 bg-green-100" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-semibold text-purple-600 mb-1">Overall Score</div>
                  <div className="text-3xl font-bold text-purple-600">{overallScore}</div>
                  <div className="text-sm text-gray-600">Points</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-blue-600">Processing your speech...</p>
              </CardContent>
            </Card>
          </div>
        )}

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
    </div>
  );
};

export default ExerciseView;