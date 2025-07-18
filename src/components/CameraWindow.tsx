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
  className = "w-100 h-100" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string>('');
  const [faceDetector, setFaceDetector] = useState<any>(null);

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }, 
        audio: false 
      });
      
      console.log('Camera stream obtained:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      
      if (videoRef.current) {
        console.log('Video element found:', videoRef.current);
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        
        videoRef.current.play().then(() => {
          console.log('Video playing successfully');
        }).catch(err => {
          console.error('Error playing video:', err);
        });
      } else {
        console.error('Video element not found');
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsCameraOn(false);
  };

  // Simple lip area detection using basic facial geometry
  const detectLipArea = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw a simple lip detection overlay in the lower third of face area
      const centerX = canvas.width / 2;
      const faceAreaY = canvas.height * 0.6; // Approximate lip area
      const lipWidth = canvas.width * 0.15;
      const lipHeight = canvas.height * 0.08;
      
      // Draw lip outline
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line to indicate detection area
      
      // Upper lip curve
      ctx.beginPath();
      ctx.ellipse(centerX, faceAreaY, lipWidth, lipHeight/2, 0, 0, Math.PI);
      ctx.stroke();
      
      // Lower lip curve
      ctx.beginPath();
      ctx.ellipse(centerX, faceAreaY + lipHeight/4, lipWidth, lipHeight/2, 0, 0, Math.PI);
      ctx.stroke();
      
      ctx.setLineDash([]); // Reset line dash
    }

    // Continue animation loop
    if (isCameraOn) {
      animationFrameRef.current = requestAnimationFrame(detectLipArea);
    }
  };

  useEffect(() => {
    if (isActive && !isCameraOn) {
      startCamera();
    } else if (!isActive && isCameraOn) {
      stopCamera();
    }
  }, [isActive]);

  // Start lip detection when camera is on
  useEffect(() => {
    if (isCameraOn && videoRef.current) {
      const startDetection = () => {
        detectLipArea();
      };
      
      if (videoRef.current.readyState >= 1) {
        startDetection();
      } else {
        videoRef.current.addEventListener('loadedmetadata', startDetection);
        return () => {
          videoRef.current?.removeEventListener('loadedmetadata', startDetection);
        };
      }
    } else if (!isCameraOn && animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isCameraOn]);

  return (
    <Card className={`relative overflow-hidden bg-muted/50 ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={`w-full h-full object-cover rounded-lg ${isCameraOn ? 'block' : 'hidden'}`}
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none ${isCameraOn ? 'block' : 'hidden'}`}
        style={{ transform: 'scaleX(-1)' }}
      />
      
      {!isCameraOn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 bg-gray-100 rounded-lg">
          {error ? (
            <div className="text-xs text-red-500 text-center font-medium">
              {error}
            </div>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={startCamera}
                className="h-10 w-10 p-0 mb-2 border-2 border-dashed border-gray-300 hover:border-gray-400"
              >
                <Camera className="h-5 w-5 text-gray-500" />
              </Button>
              <div className="text-xs text-gray-500 text-center font-medium">
                Camera
              </div>
            </>
          )}
        </div>
      )}

      {isCameraOn && (
        <>
          <div className="absolute top-2 right-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={stopCamera}
              className="h-6 w-6 p-0 bg-black/20 hover:bg-black/40"
            >
              <CameraOff className="h-3 w-3 text-white" />
            </Button>
          </div>
          <div className="absolute bottom-1 left-1 text-xs text-white bg-red-500 px-2 py-1 rounded-full flex items-center gap-1">
            <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
            Live
          </div>
        </>
      )}
    </Card>
  );
};