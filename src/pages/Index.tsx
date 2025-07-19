
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from "@/hooks/use-toast";
import Dashboard from './Dashboard';
import ParentDashboard from './ParentDashboard';
import TherapistDashboard from './TherapistDashboard';
import { Button } from '@/components/ui/button';
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

const Index = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('home');
  const [needsAssessment, setNeedsAssessment] = useState(false);
  const [studentLevel, setStudentLevel] = useState(1);
  const [currentView, setCurrentView] = useState<'main' | 'curriculum' | 'exercise' | 'game' | 'viseme'>('main');
  const [currentGameType, setCurrentGameType] = useState<string>('candle-blow');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);

  // Redirect to auth if not logged in (with safety check)
  useEffect(() => {
    console.log('Auth check:', { loading, user: !!user, profile: !!profile });
    
    if (!loading && !user) {
      console.log('Redirecting to auth - no user');
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Handle profile-based logic
  useEffect(() => {
    if (profile?.role === 'child' && !needsAssessment) {
      console.log('Setting needs assessment for child');
      setNeedsAssessment(true);
    }
  }, [profile, needsAssessment]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
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

  // Show loading or redirect if not authenticated
  if (loading) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Loading VoiceBuddy...</div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    console.log('No user or profile, should redirect');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-center">
          <div className="text-lg text-gray-700">Redirecting...</div>
        </div>
      </div>
    );
  }

  // Parent dashboard
  if (profile.role === 'parent') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Parent Dashboard - Welcome, {profile.username}!</h1>
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </div>
          <ParentDashboard parentData={{ name: profile.username }} onLogout={handleLogout} />
        </div>
      </div>
    );
  }

  // Therapist dashboard
  if (profile.role === 'therapist') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Therapist Dashboard - Welcome, {profile.username}!</h1>
            <Button onClick={handleLogout} variant="outline">
              Sign Out
            </Button>
          </div>
          <TherapistDashboard therapistData={{ name: profile.username }} onLogout={handleLogout} />
        </div>
      </div>
    );
  }

  // Show assessment test for new child users
  if (profile.role === 'child' && needsAssessment) {
    return (
      <div className="min-h-screen">
        <div className="flex justify-between items-center p-4 bg-background border-b">
          <h1 className="text-xl font-bold">Welcome, {profile.username}!</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
        <AssessmentTest onComplete={(level) => {
          setStudentLevel(level);
          setNeedsAssessment(false);
          toast({
            title: "Assessment Complete!",
            description: `Your level has been set to ${level}. Let's start learning!`,
          });
        }} />
      </div>
    );
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
      <div className="flex justify-between items-center p-4 bg-background border-b">
        <h1 className="text-xl font-bold">Hi, {profile.username}!</h1>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
      {renderContent()}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
    </div>
  );
};

export default Index;
