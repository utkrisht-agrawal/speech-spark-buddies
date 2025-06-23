
import React, { useState } from 'react';
import Dashboard from './Dashboard';
import WordLibrary from './WordLibrary';
import PracticeView from './PracticeView';
import BottomNavigation from '@/components/BottomNavigation';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');

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
