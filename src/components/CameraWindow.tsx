import React, { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Camera, CameraOff } from 'lucide-react';

interface CameraWindowProps {
  isActive?: boolean;
  className?: string;
}

export const CameraWindow: React.FC<CameraWindowProps> = ({ 
  isActive = false, 
  className = "w-32 h-24" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string>('');

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user'
        }, 
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  useEffect(() => {
    if (isActive && !isCameraOn) {
      startCamera();
    } else if (!isActive && isCameraOn) {
      stopCamera();
    }
  }, [isActive, isCameraOn]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className={`relative overflow-hidden bg-muted/50 ${className}`}>
      {isCameraOn ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={stopCamera}
              className="h-6 w-6 p-0"
            >
              <CameraOff className="h-3 w-3" />
            </Button>
          </div>
          <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
            Live
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-2">
          {error ? (
            <div className="text-xs text-muted-foreground text-center">
              {error}
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={startCamera}
                className="h-8 w-8 p-0 mb-1"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground text-center">
                Camera
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};