import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, Volume2, MessageCircle } from 'lucide-react';

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
  const [level, setLevel] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [gameProgress, setGameProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(true);
  const [isGameComplete, setIsGameComplete] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastSpeechTime = useRef(0);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();
    setFeedback(`Choose what to say in this situation: ${currentDialog.situation}`);

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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

  const getAudioLevel = () => {
    if (!analyserRef.current) return 0;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return (average / 255) * 100;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const level = getAudioLevel();
      setLevel(level);
      
      // Speech detection when option is selected
      if (selectedOption !== null && level > 25 && Date.now() - lastSpeechTime.current > 2000) {
        lastSpeechTime.current = Date.now();
        const option = currentDialog.options[selectedOption];
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
      }
    }, 100);

    return () => clearInterval(interval);
  }, [selectedOption, score, gameProgress, currentDialog, onComplete]);

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
              
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
                <div 
                  className="absolute inset-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all duration-300"
                  style={{
                    transform: `scale(${Math.max(0.3, level / 100)})`,
                    opacity: Math.max(0.3, level / 100)
                  }}
                ></div>
                <MessageCircle className="absolute inset-0 m-auto w-8 h-8 text-white z-10" />
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Speaking Level</div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                  <div 
                    className="bg-gradient-to-r from-pink-400 to-purple-400 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, level)}%` }}
                  ></div>
                </div>
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