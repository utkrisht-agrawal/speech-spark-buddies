
import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  showNumbers?: boolean;
}

const ProgressBar = ({ 
  current, 
  max, 
  label,
  color = 'blue',
  size = 'md',
  showNumbers = true 
}: ProgressBarProps) => {
  const percentage = Math.min((current / max) * 100, 100);
  
  const getColorClasses = () => {
    switch (color) {
      case 'green': return 'bg-green-400';
      case 'purple': return 'bg-purple-400';
      case 'orange': return 'bg-orange-400';
      default: return 'bg-blue-400';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-2';
      case 'lg': return 'h-6';
      default: return 'h-4';
    }
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-semibold text-gray-700">{label}</span>
          {showNumbers && (
            <span className="text-sm font-medium text-gray-500">
              {current} / {max}
            </span>
          )}
        </div>
      )}
      
      <div className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        getSizeClasses()
      )}>
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            getColorClasses()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {size === 'lg' && (
        <div className="text-center mt-1">
          <span className="text-sm font-medium text-gray-600">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
