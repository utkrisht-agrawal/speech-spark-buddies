
import React from 'react';
import { Home, BookOpen, BarChart3, Settings, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    { id: 'practice', label: 'Practice', icon: <Target className="w-6 h-6" /> },
    { id: 'library', label: 'Library', icon: <BookOpen className="w-6 h-6" /> },
    { id: 'games', label: 'Games', icon: <BarChart3 className="w-6 h-6" /> },
    { id: 'tutorials', label: 'Tutorials', icon: <BookOpen className="w-6 h-6" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-6 h-6" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-6 h-6" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-blue-100 text-blue-600" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              <div className={cn(
                "transition-transform duration-200",
                isActive && "scale-110"
              )}>
                {item.icon}
              </div>
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-bold"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="w-1 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
