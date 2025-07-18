import React, { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Camera, CameraOff } from 'lucide-react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs';

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
  const detectorRef = useRef<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string>('');

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
    setIsCameraOn(false);
  };

  const initializeFaceDetection = async () => {
    try {
      console.log('Initializing face detection...');
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs' as const,
        maxFaces: 1,
        refineLandmarks: true,
      };
      
      const detector = await faceLandmarksDetection.createDetector(model, detectorConfig);
      detectorRef.current = detector;
      console.log('Face detector initialized');
      
      // Start face detection loop
      if (videoRef.current && isCameraOn) {
        detectFaces();
      }
    } catch (error) {
      console.error('Error initializing face detection:', error);
    }
  };

  const detectFaces = async () => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    try {
      const faces = await detectorRef.current.estimateFaces(videoRef.current);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx && faces.length > 0) {
        // Set canvas size to match video
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw lip landmarks for the first face
        const face = faces[0];
        if (face.keypoints) {
          // MediaPipe face mesh lip indices (simplified for outer lips)
          const lipIndices = [61, 62, 63, 64, 65, 66, 67, 68, 78, 79, 80, 81, 82];
          
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          
          lipIndices.forEach((index, i) => {
            if (face.keypoints[index]) {
              const point = face.keypoints[index];
              if (i === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            }
          });
          
          ctx.closePath();
          ctx.stroke();
        }
      }
      
      // Continue detection loop
      if (isCameraOn) {
        requestAnimationFrame(detectFaces);
      }
    } catch (error) {
      console.error('Error detecting faces:', error);
    }
  };

  useEffect(() => {
    if (isActive && !isCameraOn) {
      startCamera();
    } else if (!isActive && isCameraOn) {
      stopCamera();
    }
  }, [isActive]);

  useEffect(() => {
    initializeFaceDetection();
    return () => {
      stopCamera();
    };
  }, []);

  // Initialize face detection when camera starts
  useEffect(() => {
    if (isCameraOn && videoRef.current) {
      // Wait for video to load metadata before initializing detection
      const handleLoadedMetadata = () => {
        initializeFaceDetection();
      };
      
      if (videoRef.current.readyState >= 1) {
        initializeFaceDetection();
      } else {
        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => {
          videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
      }
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