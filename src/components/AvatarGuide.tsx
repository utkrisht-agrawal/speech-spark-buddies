
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AvatarGuideProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  mood?: 'happy' | 'encouraging' | 'celebrating';
  message?: string;
}

const AvatarGuide = ({ 
  isListening = false, 
  isSpeaking = false, 
  mood = 'happy',
  message 
}: AvatarGuideProps) => {
  const [eyeBlink, setEyeBlink] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(true);
      setTimeout(() => setEyeBlink(false), 150);
    }, 3000);

    return () => clearInterval(blinkInterval);
  }, []);

  const getMoodColor = () => {
    switch (mood) {
      case 'celebrating': return 'bg-yellow-300';
      case 'encouraging': return 'bg-blue-300';
      default: return 'bg-green-300';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Avatar Container */}
      <div className={cn(
        "relative w-32 h-32 rounded-full transition-all duration-500",
        getMoodColor(),
        isListening && "animate-pulse ring-4 ring-pink-300",
        isSpeaking && "scale-110"
      )}>
        {/* Face */}
        <div className="absolute inset-4 bg-orange-100 rounded-full flex items-center justify-center">
          {/* Eyes */}
          <div className="flex space-x-4 mb-2">
            <div className={cn(
              "w-3 h-3 bg-black rounded-full transition-all duration-150",
              eyeBlink && "h-1"
            )} />
            <div className={cn(
              "w-3 h-3 bg-black rounded-full transition-all duration-150",
              eyeBlink && "h-1"
            )} />
          </div>
          
          {/* Mouth - changes based on state */}
          <div className={cn(
            "absolute bottom-8 w-8 h-4 rounded-full transition-all duration-300",
            isSpeaking ? "bg-pink-500 animate-bounce" : "bg-pink-400",
            mood === 'celebrating' && "w-10 h-6"
          )} />
        </div>

        {/* Listening indicator */}
        {isListening && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Speech bubble */}
      {message && (
        <div className="bg-white px-4 py-2 rounded-2xl shadow-lg border-2 border-gray-200 max-w-xs text-center animate-fade-in">
          <p className="text-lg font-semibold text-gray-700">{message}</p>
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white" />
        </div>
      )}
    </div>
  );
};

export default AvatarGuide;
