
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
  const [currentView, setCurrentView] = useState<'main' | 'curriculum' | 'exercise' | 'game'>('main');
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
  };

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
        if (game.includes('Candle') || game.includes('Blow')) {
          setCurrentView('game');
        }
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
    return <CandleBlowGame 
      onComplete={(score) => setCurrentView('curriculum')}
      onBack={() => setCurrentView('curriculum')}
    />;
  }

  // Child interface (original app functionality)
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'library':
        return <WordLibrary />;
      case 'practice':
        return <CurriculumView 
          studentLevel={studentLevel}
          onStartExercise={(exercise) => {
            setCurrentExercise(exercise);
            setCurrentView('exercise');
          }}
          onStartGame={() => setCurrentView('game')}
        />;
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
