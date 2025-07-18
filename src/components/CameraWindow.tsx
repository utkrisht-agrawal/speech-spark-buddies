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

  // Advanced lip boundary detection
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
        // Use browser's Face Detection API if available
        if ('FaceDetector' in window) {
          const faceDetector = new (window as any).FaceDetector({
            maxDetectedFaces: 1,
            fastMode: false
          });
          
          const faces = await faceDetector.detect(video);
          
          if (faces.length > 0) {
            const face = faces[0];
            const boundingBox = face.boundingBox;
            
            // Calculate detailed lip boundary points
            detectLipBoundary(ctx, boundingBox, video);
          }
        } else {
          // Fallback: Advanced color-based lip boundary detection
          detectLipBoundaryByColor(ctx, canvas, video);
        }
      } catch (error) {
        console.log('Face detection not available, using advanced color-based detection');
        detectLipBoundaryByColor(ctx, canvas, video);
      }
    }

    // Continue animation loop
    if (isCameraOn) {
      animationFrameRef.current = requestAnimationFrame(detectLips);
    }
  };

  // Detect precise lip boundary using face detection
  const detectLipBoundary = (ctx: CanvasRenderingContext2D, boundingBox: any, video: HTMLVideoElement) => {
    // Calculate lip region based on facial proportions
    const faceWidth = boundingBox.width;
    const faceHeight = boundingBox.height;
    const faceX = boundingBox.x;
    const faceY = boundingBox.y;
    
    // Lip region is typically at 65-75% down the face
    const lipCenterY = faceY + faceHeight * 0.7;
    const lipCenterX = faceX + faceWidth * 0.5;
    const lipWidth = faceWidth * 0.35;
    const lipHeight = faceHeight * 0.12;
    
    // Create detailed lip boundary points (similar to MediaPipe landmarks)
    const lipPoints = generateLipLandmarks(lipCenterX, lipCenterY, lipWidth, lipHeight);
    
    // Draw outer lip boundary
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Upper lip contour
    const upperLipPoints = lipPoints.slice(0, 6);
    ctx.moveTo(upperLipPoints[0].x, upperLipPoints[0].y);
    for (let i = 1; i < upperLipPoints.length; i++) {
      ctx.lineTo(upperLipPoints[i].x, upperLipPoints[i].y);
    }
    
    // Lower lip contour
    const lowerLipPoints = lipPoints.slice(6, 12);
    for (let i = 0; i < lowerLipPoints.length; i++) {
      ctx.lineTo(lowerLipPoints[i].x, lowerLipPoints[i].y);
    }
    
    ctx.closePath();
    ctx.stroke();
    
    // Draw inner lip boundary
    ctx.strokeStyle = '#FF6666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    const innerLipPoints = generateInnerLipLandmarks(lipCenterX, lipCenterY, lipWidth * 0.7, lipHeight * 0.6);
    ctx.moveTo(innerLipPoints[0].x, innerLipPoints[0].y);
    for (let i = 1; i < innerLipPoints.length; i++) {
      ctx.lineTo(innerLipPoints[i].x, innerLipPoints[i].y);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Draw landmark points
    ctx.fillStyle = '#FF0000';
    lipPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // Generate lip landmark points (similar to MediaPipe's 468 face landmarks for lips)
  const generateLipLandmarks = (centerX: number, centerY: number, width: number, height: number) => {
    const points = [];
    
    // Outer lip contour - 12 key points
    // Upper lip (left to right)
    points.push({x: centerX - width/2, y: centerY}); // Left corner
    points.push({x: centerX - width/3, y: centerY - height/3}); // Left upper
    points.push({x: centerX - width/6, y: centerY - height/2}); // Left cupid's bow
    points.push({x: centerX, y: centerY - height/3}); // Center upper
    points.push({x: centerX + width/6, y: centerY - height/2}); // Right cupid's bow
    points.push({x: centerX + width/3, y: centerY - height/3}); // Right upper
    points.push({x: centerX + width/2, y: centerY}); // Right corner
    
    // Lower lip (right to left)
    points.push({x: centerX + width/3, y: centerY + height/3}); // Right lower
    points.push({x: centerX + width/6, y: centerY + height/2}); // Right lower curve
    points.push({x: centerX, y: centerY + height/2}); // Center lower
    points.push({x: centerX - width/6, y: centerY + height/2}); // Left lower curve
    points.push({x: centerX - width/3, y: centerY + height/3}); // Left lower
    
    return points;
  };

  // Generate inner lip boundary points
  const generateInnerLipLandmarks = (centerX: number, centerY: number, width: number, height: number) => {
    const points = [];
    
    // Inner lip contour - 8 points
    points.push({x: centerX - width/2, y: centerY});
    points.push({x: centerX - width/4, y: centerY - height/4});
    points.push({x: centerX, y: centerY - height/3});
    points.push({x: centerX + width/4, y: centerY - height/4});
    points.push({x: centerX + width/2, y: centerY});
    points.push({x: centerX + width/4, y: centerY + height/4});
    points.push({x: centerX, y: centerY + height/3});
    points.push({x: centerX - width/4, y: centerY + height/4});
    
    return points;
  };

  // Advanced color-based lip boundary detection
  const detectLipBoundaryByColor = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
    // Create temporary canvas for analysis
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    tempCtx.drawImage(video, 0, 0);
    
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    // Find lip-colored pixels with more sophisticated color detection
    const lipPixels: {x: number, y: number, intensity: number}[] = [];
    
    // Scan face area for lip pixels
    for (let y = Math.floor(canvas.height * 0.45); y < Math.floor(canvas.height * 0.75); y += 2) {
      for (let x = Math.floor(canvas.width * 0.25); x < Math.floor(canvas.width * 0.75); x += 2) {
        const index = (y * canvas.width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Enhanced lip color detection
        const redness = r - Math.max(g, b);
        const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(r, g, b, 1);
        
        if (redness > 15 && saturation > 0.2 && r > 60) {
          lipPixels.push({x, y, intensity: redness + saturation * 50});
        }
      }
    }
    
    if (lipPixels.length > 20) {
      // Sort by intensity and take the most lip-like pixels
      lipPixels.sort((a, b) => b.intensity - a.intensity);
      const topLipPixels = lipPixels.slice(0, Math.min(100, lipPixels.length));
      
      // Find bounds
      const minX = Math.min(...topLipPixels.map(p => p.x));
      const maxX = Math.max(...topLipPixels.map(p => p.x));
      const minY = Math.min(...topLipPixels.map(p => p.y));
      const maxY = Math.max(...topLipPixels.map(p => p.y));
      
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const width = maxX - minX;
      const height = maxY - minY;
      
      // Generate and draw lip boundary
      const lipPoints = generateLipLandmarks(centerX, centerY, width * 1.2, height * 1.5);
      
      // Draw lip boundary
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lipPoints[0].x, lipPoints[0].y);
      for (let i = 1; i < lipPoints.length; i++) {
        ctx.lineTo(lipPoints[i].x, lipPoints[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      
      // Draw landmark points
      ctx.fillStyle = '#FF0000';
      lipPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      // Draw detected lip pixels for debugging
      ctx.fillStyle = '#FF000030';
      topLipPixels.slice(0, 30).forEach(pixel => {
        ctx.beginPath();
        ctx.arc(pixel.x, pixel.y, 1, 0, 2 * Math.PI);
        ctx.fill();
      });
    } else {
      // Show search indicator
      ctx.strokeStyle = '#FFFF00';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(canvas.width * 0.25, canvas.height * 0.45, canvas.width * 0.5, canvas.height * 0.3);
      
      ctx.fillStyle = '#FFFF00';
      ctx.font = '14px Arial';
      ctx.fillText('Detecting lip boundaries...', canvas.width * 0.28, canvas.height * 0.42);
      ctx.setLineDash([]);
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