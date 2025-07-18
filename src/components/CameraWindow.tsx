import React, { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Camera, CameraOff } from 'lucide-react';

declare global {
  interface Window {
    FaceMesh: any;
    Camera: any;
    drawConnectors: any;
    FACEMESH_LIPS: any;
  }
}

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
  const faceMeshRef = useRef<any>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string>('');
  const [lipColor, setLipColor] = useState('#FF0000');

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
      
      if (videoRef.current) {
        console.log('Video element found:', videoRef.current);
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        
        videoRef.current.play().then(() => {
          console.log('Video playing successfully');
          // Initialize MediaPipe after video starts
          initializeMediaPipe();
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
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
    setIsCameraOn(false);
  };

  const initializeMediaPipe = () => {
    console.log('Initializing MediaPipe FaceMesh...');
    
    // Load MediaPipe scripts dynamically
    const loadMediaPipeScripts = async () => {
      // Load drawing utils
      if (!window.drawConnectors) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      // Load face mesh
      if (!window.FaceMesh) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      // Wait a bit for everything to load
      setTimeout(() => {
        setupFaceMesh();
      }, 1000);
    };

    loadMediaPipeScripts();
  };

  const setupFaceMesh = () => {
    if (!window.FaceMesh || !videoRef.current || !canvasRef.current) {
      console.error('MediaPipe or DOM elements not ready');
      return;
    }

    console.log('Setting up FaceMesh...');

    const faceMesh = new window.FaceMesh({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results: any) => {
      const canvasElement = canvasRef.current;
      const canvasCtx = canvasElement?.getContext('2d');
      
      if (!canvasElement || !canvasCtx) return;

      // Set canvas size to match video
      canvasElement.width = videoRef.current?.videoWidth || 640;
      canvasElement.height = videoRef.current?.videoHeight || 480;

      // Clear canvas
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Draw the image (optional - comment out if you don't want to see the video feed on canvas)
      // canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Draw lip connections using MediaPipe's FACEMESH_LIPS
        if (window.drawConnectors && window.FACEMESH_LIPS) {
          window.drawConnectors(canvasCtx, landmarks, window.FACEMESH_LIPS, { 
            color: lipColor, 
            lineWidth: 2 
          });
        } else {
          // Fallback: Draw basic lip landmarks manually
          drawLipLandmarks(canvasCtx, landmarks);
        }

        console.log('Face detected and lips drawn');
      } else {
        console.log('No face detected');
      }
    });

    faceMeshRef.current = faceMesh;

    // Start processing video
    if (videoRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (faceMeshRef.current && videoRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });
      camera.start();
    }
  };

  // Fallback function to draw lip landmarks manually
  const drawLipLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    // MediaPipe lip landmark indices
    const lipIndices = [
      // Outer lip
      [61, 62, 63, 64, 65, 66, 67],
      [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81],
      [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256, 257, 258, 259, 260, 267, 269, 270, 271, 272],
      // Inner lip  
      [78, 81, 13, 82, 18, 17, 84, 308, 324, 318]
    ];

    ctx.strokeStyle = lipColor;
    ctx.lineWidth = 2;

    // Draw outer lip boundary
    ctx.beginPath();
    const outerLip = [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];
    
    outerLip.forEach((index, i) => {
      if (landmarks[index]) {
        const point = landmarks[index];
        const x = point.x * ctx.canvas.width;
        const y = point.y * ctx.canvas.height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.closePath();
    ctx.stroke();
  };

  useEffect(() => {
    if (isActive && !isCameraOn) {
      startCamera();
    } else if (!isActive && isCameraOn) {
      stopCamera();
    }
  }, [isActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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
          {/* Lip color controls */}
          <div className="absolute top-2 left-2 flex gap-1">
            <button 
              className="w-4 h-4 bg-red-500 rounded-full border border-white"
              onClick={() => setLipColor('#FF0000')}
            />
            <button 
              className="w-4 h-4 bg-blue-500 rounded-full border border-white"
              onClick={() => setLipColor('#0066FF')}
            />
            <button 
              className="w-4 h-4 bg-green-500 rounded-full border border-white"
              onClick={() => setLipColor('#00FF00')}
            />
          </div>
        </>
      )}
    </Card>
  );
};