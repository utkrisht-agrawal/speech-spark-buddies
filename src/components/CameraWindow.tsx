import React, { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Camera, CameraOff } from 'lucide-react';

interface CameraWindowProps {
  isActive?: boolean;
  className?: string;
  /** Current phoneme user should match */
  targetPhoneme?: string;
  /** Callback with the current lip match score */
  onLipScore?: (score: number) => void;
}

export const CameraWindow: React.FC<CameraWindowProps> = ({
  isActive = false,
  className = "w-100 h-100",
  targetPhoneme,
  onLipScore
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
  const [referenceFeatures, setReferenceFeatures] = useState<number[]>([]);

  // MediaPipe lip landmark indices
  const LEFT_MOUTH = 61;
  const RIGHT_MOUTH = 291;
  const UPPER_LIP_INNER = 13;
  const LOWER_LIP_INNER = 14;
  const UPPER_LIP_TOP = 0;
  const LOWER_LIP_BOTTOM = 17;

  const dist = (a: number[], b: number[]) => {
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  };

  const extractLipFeatures = (landmarks: any[]): number[] => {
    const points = landmarks.map((lm: any) => [lm.x, lm.y]);
    const mouthWidth = dist(points[LEFT_MOUTH], points[RIGHT_MOUTH]);
    const mouthHeight = dist(points[UPPER_LIP_INNER], points[LOWER_LIP_INNER]);
    const topLipThickness = dist(points[UPPER_LIP_TOP], points[UPPER_LIP_INNER]);
    const bottomLipThickness = dist(points[LOWER_LIP_BOTTOM], points[LOWER_LIP_INNER]);
    const lipCurvature = dist(points[UPPER_LIP_TOP], points[LOWER_LIP_BOTTOM]);

    return [
      1.0,
      mouthHeight / mouthWidth,
      topLipThickness / mouthWidth,
      bottomLipThickness / mouthWidth,
      lipCurvature / mouthWidth
    ];
  };

  const computeScore = (features: number[], ref: number[]): number => {
    if (ref.length === 0) return 0;
    let sum = 0;
    for (let i = 1; i < Math.min(features.length, ref.length); i++) {
      const expected = ref[i];
      const diff = Math.abs(features[i] - expected);
      const ratio = Math.max(0, 1 - diff / expected);
      sum += ratio;
    }
    return (sum / 4) * 100;
  };

  const phonemeFileMap: Record<string, string> = {
    'AA': 'phoneme_o.json',
    'AO': 'phoneme_o.json',
    'OW': 'phoneme_o.json',
    'OY': 'phoneme_o.json',
    'EH': 'phoneme_e.json',
    'IY': 'phoneme_e.json',
    'AH': 'phoneme_u.json',
    'AH0': 'phoneme_u.json',
    'ER': 'phoneme_u.json',
    'UH': 'phoneme_u.json',
    'UW': 'phoneme_u.json',
    'F': 'phoneme_f_v.json',
    'V': 'phoneme_f_v.json',
    'L': 'phoneme_l.json',
    'W': 'phoneme_w_q.json',
    'CH': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'JH': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'D': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'G': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'K': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'N': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'R': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'S': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'Y': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'Z': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'NG': 'phoneme_c_d_g_k_n_r_s_y_z.json',
    'ZH': 'phoneme_c_d_g_k_n_r_s_y_z.json'
  };

  useEffect(() => {
    if (!targetPhoneme) return;
    const base = targetPhoneme.replace(/\d+$/, '').toUpperCase();
    const file = phonemeFileMap[base] || 'phoneme_rest.json';
    fetch(`/viseme_data/${file}`)
      .then(res => res.json())
      .then(data => {
        setReferenceFeatures(data);
      })
      .catch(() => setReferenceFeatures([]));
  }, [targetPhoneme]);

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
    // Avoid loading the same scripts multiple times or in parallel
    if ((window as any).mediapipeScriptsLoaded) {
      setScriptsLoaded(true);
      return;
    }

    if (!(window as any).mediapipeScriptsPromise) {
      (window as any).mediapipeScriptsPromise = (async () => {
        console.log('Loading MediaPipe scripts...');

        // Load in the correct order
        await loadScript(
          'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'
        );
        await loadScript(
          'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
        );
        await loadScript(
          'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js'
        );

        // Wait a bit for everything to initialize
        await new Promise((resolve) => setTimeout(resolve, 500));

        console.log('MediaPipe scripts loaded successfully');
        (window as any).mediapipeScriptsLoaded = true;
      })();
    }

    try {
      await (window as any).mediapipeScriptsPromise;
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

        const features = extractLipFeatures(landmarks);
        const score = computeScore(features, referenceFeatures);
        onLipScore?.(Math.round(score));

        const currentColor = score >= 65 ? '#00FF00' : '#FF0000';
        setLipColor(currentColor);

        // Draw lip connections using MediaPipe's FACEMESH_LIPS
        if ((window as any).drawConnectors && (window as any).FACEMESH_LIPS) {
          (window as any).drawConnectors(canvasCtx, landmarks, (window as any).FACEMESH_LIPS, {
            color: currentColor,
            lineWidth: 2
          });
        } else {
          // Fallback: Draw basic lip landmarks manually
          drawLipLandmarks(canvasCtx, landmarks, currentColor);
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
  const drawLipLandmarks = (ctx: CanvasRenderingContext2D, landmarks: any[], color: string) => {
    // MediaPipe lip landmark indices for outer lip contour
    const outerLipIndices = [
      61, 146, 91, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95
    ];
    
    // Inner lip contour
    const innerLipIndices = [
      78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 78
    ];

    ctx.strokeStyle = color;
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