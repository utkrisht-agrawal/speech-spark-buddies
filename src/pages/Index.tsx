
import React, { useState } from 'react';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import ParentDashboard from './ParentDashboard';
import TherapistDashboard from './TherapistDashboard';
import WordLibrary from './WordLibrary';
import PracticeView from './PracticeView';
import AssessmentTest from './AssessmentTest';
import CurriculumView from './CurriculumView';
import ExerciseView from './ExerciseView';
import CandleBlowGame from './CandleBlowGame';
import PopTheBalloonGame from './PopTheBalloonGame';
import FeedTheMonsterGame from './FeedTheMonsterGame';
import PhonemeRaceGame from './PhonemeRaceGame';
import SniffSnailGame from './SniffSnailGame';
import SayItToBuildItGame from './SayItToBuildItGame';
import WordPuzzlesGame from './WordPuzzlesGame';
import GuessTheObjectGame from './GuessTheObjectGame';
import ColorItRightGame from './ColorItRightGame';
import BuildTheSentenceGame from './BuildTheSentenceGame';
import BubbleSpeechGame from './BubbleSpeechGame';
import ConnectTheSentenceGame from './ConnectTheSentenceGame';
import EmotionMatchGame from './EmotionMatchGame';
import RolePlayRoomGame from './RolePlayRoomGame';
import ChooseYourDialogGame from './ChooseYourDialogGame';
import StorySpinnerGame from './StorySpinnerGame';
import SpeakYourComicStripGame from './SpeakYourComicStripGame';
import VisemePractice from './VisemePractice';
import BottomNavigation from '@/components/BottomNavigation';
import { Exercise } from '@/types/curriculum';

interface UserData {
  userType: 'child' | 'parent' | 'therapist';
  data: any;
}

const Index = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [studentLevel, setStudentLevel] = useState(1);
  const [currentView, setCurrentView] = useState<'main' | 'curriculum' | 'exercise' | 'game' | 'viseme'>('main');
  const [currentGameType, setCurrentGameType] = useState<string>('candle-blow');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  const handleLogin = (userType: 'child' | 'parent' | 'therapist', userData: any) => {
    setUser({ userType, data: userData });
    if (userType === 'child') {
      setNeedsAssessment(true);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('home');
    setCurrentView('main');
  };

  // Listen for game and practice events
  React.useEffect(() => {
    const handleCandleGame = () => {
      setCurrentView('game');
    };
    
    const handleVisemePractice = () => {
      setCurrentView('viseme');
    };
    
    window.addEventListener('startCandleGame', handleCandleGame);
    window.addEventListener('startVisemePractice', handleVisemePractice);
    return () => {
      window.removeEventListener('startCandleGame', handleCandleGame);
      window.removeEventListener('startVisemePractice', handleVisemePractice);
    };
  }, []);

  // Show login page if no user is logged in
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Parent dashboard
  if (user.userType === 'parent') {
    return <ParentDashboard parentData={user.data} onLogout={handleLogout} />;
  }

  // Therapist dashboard
  if (user.userType === 'therapist') {
    return <TherapistDashboard therapistData={user.data} onLogout={handleLogout} />;
  }

  // Show assessment test for new child users
  if (user.userType === 'child' && needsAssessment) {
    return <AssessmentTest onComplete={(level) => {
      setStudentLevel(level);
      setNeedsAssessment(false);
    }} />;
  }

  // Handle different views for child interface
  if (currentView === 'curriculum') {
    return <CurriculumView 
      studentLevel={studentLevel}
      onStartExercise={(exercise) => {
        setCurrentExercise(exercise);
        setCurrentView('exercise');
      }}
      onStartGame={(game) => {
        // Map game names to game types
        if (game.includes('Pop') || game.includes('Balloon')) {
          setCurrentGameType('pop-balloon');
        } else if (game.includes('Feed') || game.includes('Monster')) {
          setCurrentGameType('feed-monster');
        } else if (game.includes('Phoneme Race')) {
          setCurrentGameType('phoneme-race');
        } else if (game.includes('Sniff') || game.includes('Snail')) {
          setCurrentGameType('sniff-snail');
        } else if (game.includes('Say It') || game.includes('Build It')) {
          setCurrentGameType('say-build');
        } else if (game.includes('Word Puzzles')) {
          setCurrentGameType('word-puzzles');
        } else if (game.includes('Guess') || game.includes('Object')) {
          setCurrentGameType('guess-object');
        } else if (game.includes('Color') || game.includes('Right')) {
          setCurrentGameType('color-right');
        } else if (game.includes('Build') && game.includes('Sentence')) {
          setCurrentGameType('build-sentence');
        } else if (game.includes('Bubble') || game.includes('Speech')) {
          setCurrentGameType('bubble-speech');
        } else if (game.includes('Connect') || game.includes('Sentence')) {
          setCurrentGameType('connect-sentence');
        } else if (game.includes('Emotion') || game.includes('Match')) {
          setCurrentGameType('emotion-match');
        } else if (game.includes('Role Play') || game.includes('Room')) {
          setCurrentGameType('role-play');
        } else if (game.includes('Choose') || game.includes('Dialog')) {
          setCurrentGameType('choose-dialog');
        } else if (game.includes('Story') || game.includes('Spinner')) {
          setCurrentGameType('story-spinner');
        } else if (game.includes('Comic') || game.includes('Strip')) {
          setCurrentGameType('comic-strip');
        } else {
          setCurrentGameType('candle-blow');
        }
        setCurrentView('game');
      }}
    />;
  }

  if (currentView === 'exercise' && currentExercise) {
    return <ExerciseView 
      exercise={currentExercise}
      onComplete={(score) => {
        setCurrentView('curriculum');
        setCurrentExercise(null);
      }}
      onBack={() => setCurrentView('curriculum')}
    />;
  }

  if (currentView === 'game') {
    const gameProps = {
      onComplete: (score: number) => setCurrentView('main'),
      onBack: () => setCurrentView('main')
    };

    switch (currentGameType) {
      case 'pop-balloon': return <PopTheBalloonGame {...gameProps} />;
      case 'feed-monster': return <FeedTheMonsterGame {...gameProps} />;
      case 'phoneme-race': return <PhonemeRaceGame {...gameProps} />;
      case 'sniff-snail': return <SniffSnailGame {...gameProps} />;
      case 'say-build': return <SayItToBuildItGame {...gameProps} />;
      case 'word-puzzles': return <WordPuzzlesGame {...gameProps} />;
      case 'guess-object': return <GuessTheObjectGame {...gameProps} />;
      case 'color-right': return <ColorItRightGame {...gameProps} />;
      case 'build-sentence': return <BuildTheSentenceGame {...gameProps} />;
      case 'bubble-speech': return <BubbleSpeechGame {...gameProps} />;
      case 'connect-sentence': return <ConnectTheSentenceGame {...gameProps} />;
      case 'emotion-match': return <EmotionMatchGame {...gameProps} />;
      case 'role-play': return <RolePlayRoomGame {...gameProps} />;
      case 'choose-dialog': return <ChooseYourDialogGame {...gameProps} />;
      case 'story-spinner': return <StorySpinnerGame {...gameProps} />;
      case 'comic-strip': return <SpeakYourComicStripGame {...gameProps} />;
      default: return <CandleBlowGame {...gameProps} />;
    }
  }

  if (currentView === 'viseme') {
    return <VisemePractice 
      onBack={() => setCurrentView('main')}
      onComplete={(score) => setCurrentView('main')}
    />;
  }

  // Child interface (original app functionality)
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'practice':
        return <CurriculumView 
          studentLevel={studentLevel}
          onStartExercise={(exercise) => {
            setCurrentExercise(exercise);
            setCurrentView('exercise');
          }}
          onStartGame={(game) => {
            // Map game names to game types
            if (game.includes('Pop') || game.includes('Balloon')) {
              setCurrentGameType('pop-balloon');
            } else if (game.includes('Feed') || game.includes('Monster')) {
              setCurrentGameType('feed-monster');
            } else if (game.includes('Phoneme Race')) {
              setCurrentGameType('phoneme-race');
            } else if (game.includes('Sniff') || game.includes('Snail')) {
              setCurrentGameType('sniff-snail');
            } else if (game.includes('Say It') || game.includes('Build It')) {
              setCurrentGameType('say-build');
            } else if (game.includes('Word Puzzles')) {
              setCurrentGameType('word-puzzles');
            } else if (game.includes('Guess') || game.includes('Object')) {
              setCurrentGameType('guess-object');
            } else if (game.includes('Color') || game.includes('Right')) {
              setCurrentGameType('color-right');
            } else if (game.includes('Build') && game.includes('Sentence')) {
              setCurrentGameType('build-sentence');
            } else if (game.includes('Bubble') || game.includes('Speech')) {
              setCurrentGameType('bubble-speech');
            } else if (game.includes('Connect') || game.includes('Sentence')) {
              setCurrentGameType('connect-sentence');
            } else if (game.includes('Emotion') || game.includes('Match')) {
              setCurrentGameType('emotion-match');
            } else if (game.includes('Role Play') || game.includes('Room')) {
              setCurrentGameType('role-play');
            } else if (game.includes('Choose') || game.includes('Dialog')) {
              setCurrentGameType('choose-dialog');
            } else if (game.includes('Story') || game.includes('Spinner')) {
              setCurrentGameType('story-spinner');
            } else if (game.includes('Comic') || game.includes('Strip')) {
              setCurrentGameType('comic-strip');
            } else {
              setCurrentGameType('candle-blow');
            }
            setCurrentView('game');
          }}
        />;
      case 'library':
        return <WordLibrary />;
      case 'progress':
        return <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <h2 className="text-2xl font-bold text-gray-700">Level {studentLevel} Progress</h2>
            <p className="text-gray-600">Track your learning journey!</p>
          </div>
        </div>;
      case 'settings':
        return <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">⚙️</span>
            <h2 className="text-2xl font-bold text-gray-700">Settings</h2>
            <p className="text-gray-600">Current Level: {studentLevel}</p>
            <button 
              onClick={handleLogout}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Logout
            </button>
          </div>
        </div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderContent()}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default Index;
