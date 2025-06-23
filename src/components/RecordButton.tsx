
import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordButtonProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  disabled?: boolean;
}

const RecordButton = ({ isRecording, onToggleRecording, disabled = false }: RecordButtonProps) => {
  const [ripple, setRipple] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setRipple(true);
    setTimeout(() => setRipple(false), 300);
    onToggleRecording();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative w-24 h-24 rounded-full border-4 transition-all duration-300",
          "focus:outline-none focus:ring-4 focus:ring-offset-2",
          isRecording 
            ? "bg-red-500 border-red-600 hover:bg-red-600 focus:ring-red-300 animate-pulse" 
            : "bg-blue-500 border-blue-600 hover:bg-blue-600 focus:ring-blue-300",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "hover:scale-110 active:scale-95"
        )}
      >
        {/* Ripple effect */}
        {ripple && (
          <div className="absolute inset-0 rounded-full bg-white opacity-30 animate-ping" />
        )}
        
        {/* Icon */}
        <div className="flex items-center justify-center h-full">
          {isRecording ? (
            <Square className="w-8 h-8 text-white fill-current" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Recording indicator rings */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-red-300 animate-ping opacity-75" />
            <div className="absolute inset-2 rounded-full border-2 border-red-200 animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </button>

      <p className="text-lg font-semibold text-gray-700">
        {isRecording ? "Recording..." : "Tap to Record"}
      </p>
    </div>
  );
};

export default RecordButton;
