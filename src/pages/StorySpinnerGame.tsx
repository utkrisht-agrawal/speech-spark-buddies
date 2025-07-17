import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Mic, Volume2, RotateCcw, Star } from 'lucide-react';

interface StorySpinnerGameProps {
  onComplete: (score: number) => void;
  onBack: () => void;
}

const storyElements = {
  characters: ['brave knight', 'wise owl', 'friendly dragon', 'magical fairy', 'clever fox', 'kind princess'],
  places: ['enchanted forest', 'tall mountain', 'magical castle', 'mysterious cave', 'beautiful garden', 'sparkling lake'],
  objects: ['golden key', 'magic wand', 'treasure chest', 'flying carpet', 'crystal ball', 'rainbow bridge'],
  actions: ['discovered', 'rescued', 'explored', 'protected', 'found', 'helped']
};

const StorySpinnerGame: React.FC<StorySpinnerGameProps> = ({ onComplete, onBack }) => {
  const [currentStory, setCurrentStory] = useState({
    character: '',
    place: '',
    object: '',
    action: ''
  });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [gameProgress, setGameProgress] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [storyStep, setStoryStep] = useState(0);
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
    spinStory();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const spinStory = () => {
    setIsSpinning(true);
    setStoryStep(0);
    
    setTimeout(() => {
      const story = {
        character: storyElements.characters[Math.floor(Math.random() * storyElements.characters.length)],
        place: storyElements.places[Math.floor(Math.random() * storyElements.places.length)],
        object: storyElements.objects[Math.floor(Math.random() * storyElements.objects.length)],
        action: storyElements.actions[Math.floor(Math.random() * storyElements.actions.length)]
      };
      
      setCurrentStory(story);
      setIsSpinning(false);
      setFeedback(`Tell a story about a ${story.character}!`);
    }, 2000);
  };

  const getAudioLevel = () => {
    if (!analyserRef.current) return 0;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    return (average / 255) * 100;
  };

  const getStoryPrompt = () => {
    const prompts = [
      `Tell a story about a ${currentStory.character}`,
      `The ${currentStory.character} went to the ${currentStory.place}`,
      `There they found a ${currentStory.object}`,
      `The ${currentStory.character} ${currentStory.action} something amazing!`
    ];
    return prompts[storyStep] || prompts[0];
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const level = getAudioLevel();
      setLevel(level);
      
      // Story telling detection
      if (level > 25 && Date.now() - lastSpeechTime.current > 3000 && !isSpinning) {
        lastSpeechTime.current = Date.now();
        const newScore = score + 20;
        setScore(newScore);
        
        if (storyStep < 3) {
          setStoryStep(prev => prev + 1);
          setFeedback(`Great storytelling! +20 points. Continue: ${getStoryPrompt()}`);
        } else {
          setGameProgress(prev => prev + 1);
          if (gameProgress >= 4) {
            setIsGameComplete(true);
            setTimeout(() => onComplete(newScore), 2000);
          } else {
            setFeedback('Amazing story! +20 points. Spinning new story...');
            setTimeout(spinStory, 2000);
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [score, gameProgress, storyStep, isSpinning, currentStory, onComplete]);

  const speakStoryPrompt = () => {
    const utterance = new SpeechSynthesisUtterance(getStoryPrompt());
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  };

  if (isGameComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center p-4">
        <Card className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Story Master!</h2>
          <p className="text-gray-600 mb-4">You've become an amazing storyteller!</p>
          <p className="text-xl font-semibold text-orange-600">Final Score: {score}</p>
          <Button onClick={() => onComplete(score)} className="mt-4">
            Continue
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800">Story Spinner</h1>
            <p className="text-sm text-gray-600">Create amazing stories!</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-orange-600">Score: {score}</div>
            <div className="text-sm text-gray-600">{gameProgress}/5</div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Story Elements */}
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-6">Your Story Elements</h3>
            
            {isSpinning ? (
              <div className="flex items-center justify-center">
                <RotateCcw className="w-16 h-16 animate-spin text-orange-500" />
                <span className="ml-4 text-lg">Spinning story...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-orange-600 mb-1">Character</div>
                  <div className="text-lg font-semibold capitalize">{currentStory.character}</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-600 mb-1">Place</div>
                  <div className="text-lg font-semibold capitalize">{currentStory.place}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-red-600 mb-1">Object</div>
                  <div className="text-lg font-semibold capitalize">{currentStory.object}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Action</div>
                  <div className="text-lg font-semibold capitalize">{currentStory.action}</div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={spinStory}
              variant="outline"
              className="mt-6"
              disabled={isSpinning}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              New Story
            </Button>
          </Card>

          {/* Story Telling */}
          <Card className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-4">Tell Your Story</h3>
            
            <div className="mb-6">
              <div className="text-lg mb-4 p-4 bg-gray-50 rounded-lg">
                {getStoryPrompt()}
              </div>
              <Button 
                onClick={speakStoryPrompt}
                variant="outline"
                size="sm"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Hear Prompt
              </Button>
            </div>
            
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-300"></div>
              <div 
                className="absolute inset-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-300"
                style={{
                  transform: `scale(${Math.max(0.3, level / 100)})`,
                  opacity: Math.max(0.3, level / 100)
                }}
              ></div>
              <Star className="absolute inset-0 m-auto w-8 h-8 text-white z-10" />
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Story Level</div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-400 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, level)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{feedback}</p>
            </div>

            {/* Story Progress */}
            <div className="mt-6">
              <div className="text-sm text-gray-600 mb-2">Story Progress</div>
              <div className="flex justify-center space-x-2">
                {[0, 1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step <= storyStep ? 'bg-orange-400' : 'bg-gray-300'
                    }`}
                  ></div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card className="mt-6 p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Game Progress</span>
            <span className="text-sm text-gray-600">{gameProgress}/5</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(gameProgress / 5) * 100}%` }}
            ></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StorySpinnerGame;