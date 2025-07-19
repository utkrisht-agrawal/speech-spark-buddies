import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlaybackProps {
  audioBlob: Blob | null;
  label?: string;
}

export const AudioPlayback = ({ audioBlob, label = "Recorded Audio" }: AudioPlaybackProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Create audio URL when blob is available
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  const playAudio = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        console.error('Audio playback error');
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Error playing audio:', err);
          setIsPlaying(false);
        });
    }
  };

  const generateWaveform = () => {
    // Simple visual waveform representation
    const bars = Array.from({ length: 20 }, (_, i) => {
      const height = Math.random() * 40 + 10;
      return (
        <div
          key={i}
          className="bg-gradient-to-t from-blue-400 to-blue-600 rounded-sm"
          style={{ 
            height: `${height}px`, 
            width: '3px',
            opacity: audioBlob ? 1 : 0.3
          }}
        />
      );
    });
    return bars;
  };

  if (!audioBlob) {
    return (
      <Card className="p-4 opacity-50">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-500">No audio recorded</span>
          <div className="flex gap-1 items-end h-8">
            {generateWaveform()}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Button
          onClick={playAudio}
          size="sm"
          variant="outline"
          className="flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        
        <div className="flex flex-col flex-1">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex gap-1 items-end h-8 mt-1">
            {generateWaveform()}
          </div>
        </div>
        
        <Volume2 className="w-5 h-5 text-blue-500" />
      </div>
    </Card>
  );
};