
import React, { useState } from 'react';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import ParentDashboard from './ParentDashboard';
import TherapistDashboard from './TherapistDashboard';
import WordLibrary from './WordLibrary';
import PracticeView from './PracticeView';
import BottomNavigation from '@/components/BottomNavigation';

interface UserData {
  userType: 'child' | 'parent' | 'therapist';
  data: any;
}

const Index = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  const handleLogin = (userType: 'child' | 'parent' | 'therapist', userData: any) => {
    setUser({ userType, data: userData });
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

  // Child interface (original app functionality)
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Dashboard />;
      case 'library':
        return <WordLibrary />;
      case 'practice':
        return <PracticeView />;
      case 'progress':
        return <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📊</span>
            <h2 className="text-2xl font-bold text-gray-700">Progress Tracking</h2>
            <p className="text-gray-600">Coming soon!</p>
          </div>
        </div>;
      case 'settings':
        return <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">⚙️</span>
            <h2 className="text-2xl font-bold text-gray-700">Settings</h2>
            <p className="text-gray-600">Coming soon!</p>
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
