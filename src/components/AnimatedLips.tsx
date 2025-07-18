import React, { useEffect, useState } from 'react';

interface AnimatedLipsProps {
  phoneme: string;
  isAnimating?: boolean;
  className?: string;
}

// Preston Blair phoneme mouth shapes mapping
const phonemeShapes = {
  // A and I - open mouth, visible teeth
  'A': { mouth: 'M40 60 Q50 45 60 60 Q50 75 40 60 Z', teeth: 'visible' },
  'I': { mouth: 'M40 60 Q50 45 60 60 Q50 75 40 60 Z', teeth: 'visible' },
  'AH': { mouth: 'M40 60 Q50 45 60 60 Q50 75 40 60 Z', teeth: 'visible' },
  
  // E - slightly open, wide
  'E': { mouth: 'M38 58 Q50 50 62 58 Q50 68 38 58 Z', teeth: 'visible' },
  'EH': { mouth: 'M38 58 Q50 50 62 58 Q50 68 38 58 Z', teeth: 'visible' },
  
  // O - rounded open mouth
  'O': { mouth: 'M42 55 Q50 40 58 55 Q50 80 42 55 Z', teeth: 'hidden' },
  'OH': { mouth: 'M42 55 Q50 40 58 55 Q50 80 42 55 Z', teeth: 'hidden' },
  
  // U - small rounded opening
  'U': { mouth: 'M45 58 Q50 50 55 58 Q50 70 45 58 Z', teeth: 'hidden' },
  'UH': { mouth: 'M45 58 Q50 50 55 58 Q50 70 45 58 Z', teeth: 'hidden' },
  
  // Consonants - C, D, G, K, N, R, S, Th, Y, Z - neutral position
  'C': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'D': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'G': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'K': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'N': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'R': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'S': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'TH': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'Y': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'Z': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  
  // F and V - lower lip touches upper teeth
  'F': { mouth: 'M40 62 Q50 58 60 62 Q50 66 40 62 Z', teeth: 'upper' },
  'V': { mouth: 'M40 62 Q50 58 60 62 Q50 66 40 62 Z', teeth: 'upper' },
  
  // L - tongue tip visible
  'L': { mouth: 'M42 60 Q50 56 58 60 Q50 64 42 60 Z', teeth: 'tongue' },
  
  // M, B, P - lips closed
  'M': { mouth: 'M42 60 Q50 60 58 60 Q50 60 42 60 Z', teeth: 'hidden' },
  'B': { mouth: 'M42 60 Q50 60 58 60 Q50 60 42 60 Z', teeth: 'hidden' },
  'P': { mouth: 'M42 60 Q50 60 58 60 Q50 60 42 60 Z', teeth: 'hidden' },
  
  // W and Q - rounded, protruded
  'W': { mouth: 'M44 58 Q50 48 56 58 Q50 72 44 58 Z', teeth: 'hidden' },
  'Q': { mouth: 'M44 58 Q50 48 56 58 Q50 72 44 58 Z', teeth: 'hidden' },
  
  // Rest position
  'REST': { mouth: 'M43 60 Q50 58 57 60 Q50 62 43 60 Z', teeth: 'hidden' },
  'ER': { mouth: 'M43 60 Q50 58 57 60 Q50 62 43 60 Z', teeth: 'hidden' },
  'T': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
  'H': { mouth: 'M42 60 Q50 55 58 60 Q50 65 42 60 Z', teeth: 'slight' },
};

const AnimatedLips: React.FC<AnimatedLipsProps> = ({ 
  phoneme, 
  isAnimating = false, 
  className = "" 
}) => {
  const [currentShape, setCurrentShape] = useState(phonemeShapes['REST']);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const targetShape = phonemeShapes[phoneme as keyof typeof phonemeShapes] || phonemeShapes['REST'];
    setCurrentShape(targetShape);
  }, [phoneme]);

  useEffect(() => {
    if (isAnimating) {
      const interval = setInterval(() => {
        setAnimationPhase(prev => (prev + 1) % 4);
      }, 200);
      return () => clearInterval(interval);
    } else {
      setAnimationPhase(0);
    }
  }, [isAnimating]);

  const getTeethVisibility = () => {
    switch (currentShape.teeth) {
      case 'visible':
        return 1;
      case 'slight':
        return 0.3;
      case 'upper':
        return 0.5;
      case 'tongue':
        return 0.2;
      default:
        return 0;
    }
  };

  const animationScale = isAnimating ? 1 + Math.sin(animationPhase) * 0.05 : 1;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        width="200" 
        height="150" 
        viewBox="0 0 100 100" 
        className="transition-transform duration-200"
        style={{ transform: `scale(${animationScale})` }}
      >
        {/* Face outline */}
        <ellipse
          cx="50"
          cy="45"
          rx="35"
          ry="40"
          fill="hsl(var(--muted))"
          stroke="hsl(var(--border))"
          strokeWidth="1"
        />
        
        {/* Eyes */}
        <circle cx="40" cy="35" r="3" fill="hsl(var(--foreground))" />
        <circle cx="60" cy="35" r="3" fill="hsl(var(--foreground))" />
        
        {/* Nose */}
        <path
          d="M50 45 L48 50 L50 52 L52 50 Z"
          fill="hsl(var(--muted-foreground))"
          opacity="0.6"
        />
        
        {/* Upper teeth (when visible) */}
        {getTeethVisibility() > 0 && (
          <rect
            x="45"
            y="57"
            width="10"
            height="3"
            fill="white"
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
            opacity={getTeethVisibility()}
          />
        )}
        
        {/* Tongue (for L sound) */}
        {currentShape.teeth === 'tongue' && (
          <ellipse
            cx="50"
            cy="60"
            rx="3"
            ry="2"
            fill="hsl(var(--destructive))"
            opacity="0.8"
          />
        )}
        
        {/* Mouth */}
        <path
          d={currentShape.mouth}
          fill="hsl(var(--background))"
          stroke="hsl(var(--foreground))"
          strokeWidth="1.5"
          className="transition-all duration-300"
        />
        
        {/* Lip highlights */}
        <path
          d={currentShape.mouth}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          opacity="0.6"
          className="transition-all duration-300"
        />
      </svg>
      
      {/* Phoneme label */}
      <div className="ml-4">
        <div className="text-2xl font-bold text-primary">{phoneme}</div>
        <div className="text-sm text-muted-foreground">
          {isAnimating ? 'Speaking...' : 'Ready'}
        </div>
      </div>
    </div>
  );
};

export default AnimatedLips;