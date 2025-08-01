import React, { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { phonemeImageMap } from './AnimatedLips';

interface CameraWindowProps {
  isActive?: boolean;
  className?: string;
  targetPhoneme?: string;
}

export const CameraWindow: React.FC<CameraWindowProps> = ({
  isActive = false,
  className = "w-100 h-100",
  targetPhoneme
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [error, setError] = useState<string>('');
  const [lipColor, setLipColor] = useState('#FF0000');
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  const [visemeData, setVisemeData] = useState<any | null>(null);

  useEffect(() => {
    fetch('/viseme_landmarks.json')
      .then(res => res.json())
      .then(data => setVisemeData(data))
      .catch(err => console.error('Failed to load viseme landmarks', err));
  }, []);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  const loadMediaPipeScripts = async () => {
    try {
      console.log('Loading MediaPipe scripts...');
      
      // Load in the correct order
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
      
      // Wait a bit for everything to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('MediaPipe scripts loaded successfully');
      setScriptsLoaded(true);
    } catch (error) {
      console.error('Error loading MediaPipe scripts:', error);
      setError('Failed to load MediaPipe scripts');
    }
  };

  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      setError('');
      
      if (!scriptsLoaded) {
        await loadMediaPipeScripts();
      }
      
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
          setTimeout(() => {
            initializeMediaPipe();
          }, 1000);
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
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    setIsCameraOn(false);
  };

  const initializeMediaPipe = () => {
    console.log('Initializing MediaPipe FaceMesh...');
    
    // Check if MediaPipe is available
    if (typeof (window as any).FaceMesh === 'undefined') {
      console.error('FaceMesh not available');
      return;
    }

    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas element not ready');
      return;
    }

    console.log('Setting up FaceMesh...');

    const faceMesh = new (window as any).FaceMesh({
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
      
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Draw lip connections using MediaPipe's FACEMESH_LIPS
        if ((window as any).drawConnectors && (window as any).FACEMESH_LIPS) {
          (window as any).drawConnectors(canvasCtx, landmarks, (window as any).FACEMESH_LIPS, {
            color: lipColor,
            lineWidth: 2
          });
        } else {
          // Fallback: Draw basic lip landmarks manually
          drawLipLandmarks(canvasCtx, landmarks);
        }

        // Evaluate match against target phoneme
        if (targetPhoneme && visemeData) {
          const normalized = targetPhoneme.replace(/\d+$/, '');
          const img = phonemeImageMap[normalized];
          const key = img ? img.replace(/^\//, '') : '';
          const target = visemeData.landmarks?.[key];
          const indices: number[] = visemeData.indices || [];
          if (target && indices.length > 0) {
            const xs = indices.map((i: number) => landmarks[i].x);
            const ys = indices.map((i: number) => landmarks[i].y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const norm = indices.map((i: number) => [
              (landmarks[i].x - minX) / (maxX - minX + 1e-6),
              (landmarks[i].y - minY) / (maxY - minY + 1e-6)
            ]);
            let dist = 0;
            for (let j = 0; j < target.length; j++) {
              const dx = norm[j][0] - target[j][0];
              const dy = norm[j][1] - target[j][1];
              dist += Math.sqrt(dx * dx + dy * dy);
            }
            const avg = dist / target.length;
            setLipColor(avg < 0.15 ? '#00FF00' : '#FF0000');
          }
        }
      } else {
        console.log('No face detected');
      }
    });

    faceMeshRef.current = faceMesh;

    // Start processing video using MediaPipe Camera
    if (videoRef.current && typeof (window as any).Camera !== 'undefined') {
      const camera = new (window as any).Camera(videoRef.current, {
        onFrame: async () => {
          if (faceMeshRef.current && videoRef.current) {
            await faceMeshRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480
      });
      
      cameraRef.current = camera;
      camera.start();
      console.log('MediaPipe camera started');
    } else {
      console.error('MediaPipe Camera not available');
    }
  };

  // Fallback function to draw lip landmarks manually
  const drawLipLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    // MediaPipe lip landmark indices for outer lip contour
    const outerLipIndices = [
      61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95
    ];
    
    // Inner lip contour
    const innerLipIndices = [
      78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 78
    ];

    ctx.strokeStyle = lipColor;
    ctx.lineWidth = 2;

    // Draw outer lip
    ctx.beginPath();
    outerLipIndices.forEach((index, i) => {
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

    // Draw inner lip
    ctx.beginPath();
    innerLipIndices.forEach((index, i) => {
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