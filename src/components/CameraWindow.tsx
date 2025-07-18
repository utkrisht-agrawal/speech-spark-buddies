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

  // Real face and lip detection using browser's Face Detection API
  const detectLips = async () => {
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
      
      try {
        // Try to use browser's native Face Detection API if available
        if ('FaceDetector' in window) {
          const faceDetector = new (window as any).FaceDetector({
            maxDetectedFaces: 1,
            fastMode: false
          });
          
          const faces = await faceDetector.detect(video);
          
          if (faces.length > 0) {
            const face = faces[0];
            const boundingBox = face.boundingBox;
            
            // Calculate lip area based on face bounding box
            const lipY = boundingBox.y + boundingBox.height * 0.7; // Lips are about 70% down the face
            const lipX = boundingBox.x + boundingBox.width * 0.5;   // Center of face
            const lipWidth = boundingBox.width * 0.3;               // Lips are about 30% of face width
            const lipHeight = boundingBox.height * 0.08;            // Lips are about 8% of face height
            
            // Draw detected lip area
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            
            // Upper lip
            ctx.beginPath();
            ctx.ellipse(lipX, lipY - lipHeight/4, lipWidth/2, lipHeight/3, 0, 0, Math.PI);
            ctx.stroke();
            
            // Lower lip  
            ctx.beginPath();
            ctx.ellipse(lipX, lipY + lipHeight/4, lipWidth/2, lipHeight/2, 0, Math.PI, 2 * Math.PI);
            ctx.stroke();
            
            // Draw face bounding box for reference
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.strokeRect(boundingBox.x, boundingBox.y, boundingBox.width, boundingBox.height);
          }
        } else {
          // Fallback: Simple color-based lip detection
          detectLipsByColor(ctx, canvas, video);
        }
      } catch (error) {
        console.log('Face detection not available, using color-based detection');
        detectLipsByColor(ctx, canvas, video);
      }
    }

    // Continue animation loop
    if (isCameraOn) {
      animationFrameRef.current = requestAnimationFrame(detectLips);
    }
  };

  // Fallback color-based lip detection
  const detectLipsByColor = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    // Create a temporary canvas to analyze video frame
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    
    // Draw current video frame
    tempCtx.drawImage(video, 0, 0);
    
    // Get image data for color analysis
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    // Simple lip detection by looking for red/pink areas in lower face area
    const lipCandidates: {x: number, y: number}[] = [];
    
    // Scan lower half of frame for lip-colored pixels
    for (let y = Math.floor(tempCanvas.height * 0.4); y < Math.floor(tempCanvas.height * 0.8); y += 4) {
      for (let x = Math.floor(tempCanvas.width * 0.2); x < Math.floor(tempCanvas.width * 0.8); x += 4) {
        const index = (y * tempCanvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Check if pixel has lip-like color (reddish/pink)
        if (r > g + 20 && r > b + 10 && r > 80) {
          lipCandidates.push({x, y});
        }
      }
    }
    
    if (lipCandidates.length > 10) {
      // Find center of lip candidates
      const avgX = lipCandidates.reduce((sum, p) => sum + p.x, 0) / lipCandidates.length;
      const avgY = lipCandidates.reduce((sum, p) => sum + p.y, 0) / lipCandidates.length;
      
      // Draw detected lip area
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      
      ctx.beginPath();
      ctx.ellipse(avgX, avgY, 40, 15, 0, 0, 2 * Math.PI);
      ctx.stroke();
      
      // Draw detection points
      ctx.fillStyle = '#FF000050';
      lipCandidates.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      });
    } else {
      // No lips detected, show search area
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.4, canvas.width * 0.6, canvas.height * 0.4);
      
      ctx.fillStyle = '#FFFF00';
      ctx.font = '16px Arial';
      ctx.fillText('Looking for lips...', canvas.width * 0.3, canvas.height * 0.35);
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
        detectLips();
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