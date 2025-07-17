import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, Volume2, BookOpen, ChevronRight } from 'lucide-react';

interface SpeakYourComicStripGameProps {
  onComplete: (score: number) => void;
  onBack: () => void;
}

const comicStrips = [
  {
    title: 'The Helpful Cat',
    panels: [
      { image: '🐱', text: 'Once there was a friendly cat named Whiskers.' },
      { image: '🏠', text: 'Whiskers lived in a cozy house with his family.' },
      { image: '🐦', text: 'One day, he saw a little bird that was lost.' },
      { image: '🐱🐦', text: 'Whiskers helped the bird find its way home.' }
    ]
  },
  {
    title: 'The Magic Garden',
    panels: [
      { image: '🌱', text: 'Emma planted seeds in her garden.' },
      { image: '🌧️', text: 'She watered them every day.' },
      { image: '🌸', text: 'Beautiful flowers began to bloom.' },
      { image: '🦋', text: 'Butterflies came to visit the colorful garden.' }
    ]
  },
  {
    title: 'The Brave Little Mouse',
    panels: [
      { image: '🐭', text: 'A tiny mouse lived in the barn.' },
      { image: '🧀', text: 'She dreamed of finding the biggest cheese.' },
      { image: '🏔️', text: 'She climbed the tallest mountain of hay.' },
      { image: '🏆', text: 'At the top, she found the golden cheese!' }
    ]
  }
];

const SpeakYourComicStripGame: React.FC<SpeakYourComicStripGameProps> = ({ onComplete, onBack }) => {
  const [currentComic, setCurrentComic] = useState(comicStrips[0]);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [gameProgress, setGameProgress] = useState(0);
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
    setFeedback(`Read panel ${currentPanel + 1} of "${currentComic.title}"`);

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const nextComic = () => {
    const randomComic = comicStrips[Math.floor(Math.random() * comicStrips.length)];
    setCurrentComic(randomComic);
    setCurrentPanel(0);
    setFeedback(`New comic: "${randomComic.title}" - Read panel 1`);
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
      
      // Comic reading detection
      if (level > 25 && Date.now() - lastSpeechTime.current > 3000) {
        lastSpeechTime.current = Date.now();
        const newScore = score + 15;
        setScore(newScore);
        
        if (currentPanel < currentComic.panels.length - 1) {
          setCurrentPanel(prev => prev + 1);
          setFeedback(`Great reading! +15 points. Now read panel ${currentPanel + 2}`);
        } else {
          setGameProgress(prev => prev + 1);
          setFeedback('Comic complete! +15 points. Starting new comic...');
          
          if (gameProgress >= 5) {
            setIsGameComplete(true);
            setTimeout(() => onComplete(newScore), 2000);
          } else {
            setTimeout(nextComic, 2000);
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [score, gameProgress, currentPanel, currentComic, onComplete]);

  const speakPanel = () => {
    const utterance = new SpeechSynthesisUtterance(currentComic.panels[currentPanel].text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  const nextPanel = () => {
    if (currentPanel < currentComic.panels.length - 1) {
      setCurrentPanel(prev => prev + 1);
      setFeedback(`Now read panel ${currentPanel + 2}`);
    }
  };

  if (isGameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center p-4">
        <Card className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Comic Master!</h2>
          <p className="text-gray-600 mb-4">You've become an excellent storyteller!</p>
          <p className="text-xl font-semibold text-blue-600">Final Score: {score}</p>
          <Button onClick={() => onComplete(score)} className="mt-4">
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Speak Your Comic Strip</h1>
            <p className="text-sm text-gray-600">Read the comic story aloud!</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-blue-600">Score: {score}</div>
            <div className="text-sm text-gray-600">{gameProgress}/6</div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Comic Title */}
          <Card className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentComic.title}</h2>
            <div className="text-sm text-gray-600">Panel {currentPanel + 1} of {currentComic.panels.length}</div>
          </Card>

          {/* Comic Strip */}
          <div className="grid gap-4 md:grid-cols-4">
            {currentComic.panels.map((panel, index) => (
              <Card 
                key={index} 
                className={`p-6 text-center transition-all duration-300 ${
                  index === currentPanel 
                    ? 'ring-2 ring-blue-400 bg-blue-50' 
                    : index < currentPanel 
                      ? 'bg-green-50' 
                      : 'bg-gray-50'
                }`}
              >
                <div className="text-6xl mb-4">{panel.image}</div>
                <div className="text-sm text-gray-700 mb-3">{panel.text}</div>
                {index === currentPanel && (
                  <div className="text-xs text-blue-600 font-semibold">Current Panel</div>
                )}
                {index < currentPanel && (
                  <div className="text-xs text-green-600 font-semibold">✓ Read</div>
                )}
              </Card>
            ))}
          </div>

          {/* Current Panel Focus */}
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Read This Panel</h3>
            <div className="text-8xl mb-6">{currentComic.panels[currentPanel].image}</div>
            <div className="text-xl mb-6 p-4 bg-gray-50 rounded-lg">
              {currentComic.panels[currentPanel].text}
            </div>
            
            <div className="flex justify-center space-x-4 mb-6">
              <Button 
                onClick={speakPanel}
                variant="outline"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Hear Example
              </Button>
              {currentPanel < currentComic.panels.length - 1 && (
                <Button 
                  onClick={nextPanel}
                  variant="outline"
                >
                  Skip Panel
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Voice Input */}
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div 
                className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 transition-all duration-300"
                style={{
                  transform: `scale(${Math.max(0.3, level / 100)})`,
                  opacity: Math.max(0.3, level / 100)
                }}
              ></div>
              <BookOpen className="absolute inset-0 m-auto w-8 h-8 text-white z-10" />
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Reading Level</div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-indigo-400 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, level)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{feedback}</p>
            </div>
          </Card>
        </div>

        {/* Progress */}
        <Card className="mt-6 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Game Progress</span>
            <span className="text-sm text-gray-600">{gameProgress}/6</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-400 to-indigo-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(gameProgress / 6) * 100}%` }}
            ></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SpeakYourComicStripGame;