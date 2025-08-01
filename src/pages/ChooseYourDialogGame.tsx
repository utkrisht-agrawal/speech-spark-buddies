import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, Volume2, MessageCircle } from 'lucide-react';
import { scoreSpeech } from '@/utils/speechRecognition';

interface ChooseYourDialogGameProps {
  onComplete: (score: number) => void;
  onBack: () => void;
}

const dialogOptions = [
  {
    situation: 'Meeting a new friend',
    options: [
      { text: 'Hello, nice to meet you!', points: 15, feedback: 'Perfect greeting!' },
      { text: 'What\'s your name?', points: 10, feedback: 'Good conversation starter!' },
      { text: 'Do you want to play?', points: 12, feedback: 'Great way to make friends!' }
    ],
    icon: '👋'
  },
  {
    situation: 'Asking for help',
    options: [
      { text: 'Excuse me, can you help me?', points: 15, feedback: 'Very polite!' },
      { text: 'I need help, please', points: 12, feedback: 'Good manners!' },
      { text: 'Could you show me how?', points: 14, feedback: 'Great question!' }
    ],
    icon: '🙋'
  },
  {
    situation: 'Sharing something',
    options: [
      { text: 'Would you like to share this?', points: 15, feedback: 'Very generous!' },
      { text: 'Let\'s share together', points: 12, feedback: 'Nice sharing!' },
      { text: 'You can have some too', points: 13, feedback: 'Kind gesture!' }
    ],
    icon: '🤝'
  },
  {
    situation: 'Saying goodbye',
    options: [
      { text: 'See you later!', points: 12, feedback: 'Friendly goodbye!' },
      { text: 'It was nice talking to you', points: 15, feedback: 'Very thoughtful!' },
      { text: 'Have a great day!', points: 14, feedback: 'Such a kind wish!' }
    ],
    icon: '👋'
  }
];

const ChooseYourDialogGame: React.FC<ChooseYourDialogGameProps> = ({ onComplete, onBack }) => {
  const [currentDialog, setCurrentDialog] = useState(dialogOptions[0]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [gameProgress, setGameProgress] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showOptions, setShowOptions] = useState(true);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    setFeedback(`Choose what to say in this situation: ${currentDialog.situation}`);
  }, [currentDialog]);

  const startRecording = async () => {
    if (selectedOption === null) return;
    
    try {
      setMicrophoneError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await processRecordedAudio(audioBlob);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      recorder.start();
      setIsRecording(true);
      
      // Record for 4 seconds for sentences
      setTimeout(() => {
        if (recorder && recorder.state === 'recording') {
          recorder.stop();
        }
      }, 4000);
    } catch (error) {
      setMicrophoneError('Microphone access denied');
      setIsRecording(false);
    }
  };

  const processRecordedAudio = async (audioBlob: Blob) => {
    if (selectedOption === null) return;
    
    try {
      const option = currentDialog.options[selectedOption];
      const result = await scoreSpeech(audioBlob, option.text, 'sentence');
      
      if (result.similarityScore >= 80) {
        const newScore = score + option.points;
        setScore(newScore);
        setGameProgress(prev => prev + 1);
        setFeedback(option.feedback + ` +${option.points} points`);
        
        if (gameProgress >= 9) {
          setIsGameComplete(true);
          setTimeout(() => onComplete(newScore), 2000);
        } else {
          setTimeout(nextDialog, 2000);
        }
      } else {
        setMicrophoneError(`Say "${option.text}" - Score: ${Math.round(result.similarityScore)}%`);
        setTimeout(() => setMicrophoneError(null), 2000);
      }
    } catch (error) {
      console.error('Speech scoring failed:', error);
      setMicrophoneError('Speech recognition failed. Try again!');
      setTimeout(() => setMicrophoneError(null), 2000);
    }
  };

  const nextDialog = () => {
    const randomDialog = dialogOptions[Math.floor(Math.random() * dialogOptions.length)];
    setCurrentDialog(randomDialog);
    setSelectedOption(null);
    setShowOptions(true);
    setFeedback(`Choose what to say in this situation: ${randomDialog.situation}`);
  };

  const selectOption = (index: number) => {
    setSelectedOption(index);
    setShowOptions(false);
    const option = currentDialog.options[index];
    setFeedback(`Great choice! Now say: "${option.text}"`);
  };

  const speakSituation = () => {
    const utterance = new SpeechSynthesisUtterance(currentDialog.situation);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const speakOption = (optionText: string) => {
    const utterance = new SpeechSynthesisUtterance(optionText);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (isGameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center p-4">
        <Card className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dialog Master!</h2>
          <p className="text-gray-600 mb-4">You've mastered conversation choices!</p>
          <p className="text-xl font-semibold text-pink-600">Final Score: {score}</p>
          <Button onClick={() => onComplete(score)} className="mt-4">
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Choose Your Dialog</h1>
            <p className="text-sm text-gray-600">Pick the best thing to say!</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-pink-600">Score: {score}</div>
            <div className="text-sm text-gray-600">{gameProgress}/10</div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Situation */}
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">{currentDialog.icon}</div>
            <h3 className="text-2xl font-bold mb-4">Situation:</h3>
            <div className="text-xl text-gray-700 mb-4 p-4 bg-gray-50 rounded-lg">
              {currentDialog.situation}
            </div>
            <Button 
              onClick={speakSituation}
              variant="outline"
              className="mt-4"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Hear Situation
            </Button>
          </Card>

          {/* Dialog Options */}
          {showOptions && (
            <div className="grid gap-4 md:grid-cols-3">
              {currentDialog.options.map((option, index) => (
                <Card 
                  key={index} 
                  className="p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => selectOption(index)}
                >
                  <div className="text-4xl mb-3">💭</div>
                  <div className="text-gray-700 mb-3">"{option.text}"</div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      speakOption(option.text);
                    }}
                  >
                    <Volume2 className="w-3 h-3 mr-1" />
                    Listen
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Voice Input (when option selected) */}
          {selectedOption !== null && (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-semibold mb-4">Now Say It!</h3>
              <div className="text-lg mb-4 p-4 bg-pink-50 rounded-lg">
                "{currentDialog.options[selectedOption].text}"
              </div>
              
              <div className="mb-6">
                {!isRecording ? (
                  <Button onClick={startRecording} className="bg-green-500 hover:bg-green-600">
                    <Mic className="w-4 h-4 mr-2" />
                    Start Recording
                  </Button>
                ) : (
                  <Button disabled className="bg-gray-400 text-white">
                    <Mic className="w-4 h-4 mr-2" />
                    Recording...
                  </Button>
                )}
              </div>
              
              {microphoneError && (
                <p className="text-sm text-red-600 mb-4">
                  {microphoneError}
                </p>
              )}
              
              <div className="text-center">
                <p className="text-sm text-gray-600">{feedback}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Progress */}
        <Card className="mt-6 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Game Progress</span>
            <span className="text-sm text-gray-600">{gameProgress}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-pink-400 to-purple-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(gameProgress / 10) * 100}%` }}
            ></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChooseYourDialogGame;