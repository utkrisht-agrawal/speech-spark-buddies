import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, SkipForward } from 'lucide-react';
import { ASSESSMENT_QUESTIONS } from '@/data/curriculum';
import AvatarGuide from '@/components/AvatarGuide';
import RecordButton from '@/components/RecordButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdvancedSpeechRecognition } from '@/utils/speechRecognition';

interface AssessmentTestProps {
  onComplete: (assignedLevel: number) => void;
}

const AssessmentTest: React.FC<AssessmentTestProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [speechRecognition] = useState(() => new AdvancedSpeechRecognition());

  const question = ASSESSMENT_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / ASSESSMENT_QUESTIONS.length) * 100;

  const handleRecord = async () => {
    if (!isRecording) {
      setIsRecording(true);
      await speechRecognition.startRecording();

      let duration = 2000;
      if (question.type === 'word') {
        duration = 3000;
      } else if (question.type === 'sentence') {
        duration = question.expectedResponse.split(' ').length * 2000;
      }

      setTimeout(async () => {
        if (speechRecognition.isRecording()) {
          const audioBlob = await speechRecognition.stopRecording();
          const mode = question.type === 'sentence' ? 'sentence' : question.type;
          try {
            const result = await speechRecognition.recognizeSpeech(
              audioBlob,
              question.expectedResponse,
              mode
            );
            setResponses(prev => ({ ...prev, [question.id]: result.similarityScore }));
          } catch (e) {
            console.error('Scoring failed', e);
            setResponses(prev => ({ ...prev, [question.id]: 0 }));
          }
          setIsRecording(false);
          setShowResult(true);
        }
      }, duration);
    } else {
      const audioBlob = await speechRecognition.stopRecording();
      const mode = question.type === 'sentence' ? 'sentence' : question.type;
      try {
        const result = await speechRecognition.recognizeSpeech(
          audioBlob,
          question.expectedResponse,
          mode
        );
        setResponses(prev => ({ ...prev, [question.id]: result.similarityScore }));
      } catch (e) {
        console.error('Scoring failed', e);
        setResponses(prev => ({ ...prev, [question.id]: 0 }));
      }
      setIsRecording(false);
      setShowResult(true);
    }
  };

  const handleNext = async () => {
    setShowResult(false);
    if (currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Determine level based on specific scores
      const p1 = responses['a1'] || 0;
      const p2 = responses['a2'] || 0;
      const w1 = responses['a3'] || 0;
      const w2 = responses['a4'] || 0;
      const s1 = responses['a5'] || 0;

      let assignedLevel = 1;

      if (p1 >= 90 && p2 >= 90) {
        assignedLevel = 3;
        if (w1 >= 90 && w2 >= 90) {
          assignedLevel = 6;
          if (s1 >= 90) {
            assignedLevel = 8;
          }
        }
      }
      
      try {
        // Update the user's profile to mark assessment as completed and set level
        const { error } = await supabase
          .from('profiles')
          .update({ assessment_completed: true, current_level: assignedLevel })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

        if (error) {
          console.error('Error updating assessment status:', error);
          toast.error('Failed to save assessment progress');
          return;
        }

        onComplete(assignedLevel);
        toast.success(`Assessment completed! Your level is ${assignedLevel}`);
      } catch (error) {
        console.error('Error completing assessment:', error);
        toast.error('Failed to complete assessment');
      }
    }
  };

  const handleSkip = () => {
    setResponses(prev => ({ ...prev, [question.id]: 50 })); // Default score for skipped
    handleNext();
  };

  const playPronunciation = () => {
    // Mock pronunciation playback
    console.log(`Playing pronunciation for: ${question.expectedResponse}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">
            Speech Assessment Test
          </h1>
          <p className="text-gray-600">
            Let's find the perfect level for you!
          </p>
          <Progress value={progress} className="mt-4" />
          <p className="text-sm text-gray-500 mt-2">
            Question {currentQuestion + 1} of {ASSESSMENT_QUESTIONS.length}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center text-xl">
              {question.prompt}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Guide */}
            <div className="flex justify-center">
              <AvatarGuide
                isListening={isRecording}
                mood="encouraging"
                message={isRecording ? "I'm listening..." : "Press the microphone to speak"}
              />
            </div>

            {/* Expected Response Display */}
            <div className="text-center">
              <div className="bg-blue-50 p-4 rounded-xl mb-4">
                <p className="text-sm text-gray-600 mb-2">Say this:</p>
                <p className="text-2xl font-bold text-blue-800">
                  {question.expectedResponse.toUpperCase()}
                </p>
              </div>
              
              <Button
                variant="outline"
                onClick={playPronunciation}
                className="mb-4"
              >
                <Play className="w-4 h-4 mr-2" />
                Hear Pronunciation
              </Button>
            </div>

            {/* Recording Interface */}
            <div className="text-center space-y-4">
              <RecordButton
                isRecording={isRecording}
                onToggleRecording={handleRecord}
              />
              
              {isRecording && (
                <div className="flex justify-center">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-8 bg-red-400 rounded animate-pulse"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Result Display */}
            {showResult && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-green-800 font-semibold mb-2">
                    Score: {Math.round(responses[question.id])}%
                  </p>
                  <div className="flex justify-center space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-2xl ${
                          i < Math.ceil(responses[question.id] / 20)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isRecording}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip
              </Button>
              
              {showResult && (
                <Button onClick={handleNext}>
                  {currentQuestion < ASSESSMENT_QUESTIONS.length - 1 ? 'Next Question' : 'Complete Assessment'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Difficulty Indicator */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Difficulty: {question.difficulty}/4
          </p>
          <div className="flex justify-center mt-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full mx-1 ${
                  i < question.difficulty ? 'bg-orange-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentTest;