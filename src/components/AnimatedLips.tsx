import React, { useEffect, useState } from 'react';

interface AnimatedLipsProps {
  phoneme: string;
  isAnimating?: boolean;
  className?: string;
}

// Enhanced Preston Blair phoneme mouth shapes with proper lip and tongue positioning
const phonemeShapes = {
  // A and I - wide open mouth, jaw dropped
  'A': { 
    upperLip: 'M15 45 Q50 35 85 45',
    lowerLip: 'M20 65 Q50 75 80 65', 
    innerMouth: 'M25 50 Q50 45 75 50 Q50 70 25 50 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 8
  },
  'I': { 
    upperLip: 'M20 48 Q50 40 80 48',
    lowerLip: 'M22 60 Q50 65 78 60', 
    innerMouth: 'M28 52 Q50 48 72 52 Q50 62 28 52 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 4
  },
  'AH': { 
    upperLip: 'M18 46 Q50 36 82 46',
    lowerLip: 'M22 64 Q50 72 78 64', 
    innerMouth: 'M26 51 Q50 46 74 51 Q50 68 26 51 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 6
  },
  
  // E - wide smile, corners pulled back
  'E': { 
    upperLip: 'M10 50 Q50 45 90 50',
    lowerLip: 'M12 58 Q50 62 88 58', 
    innerMouth: 'M18 52 Q50 50 82 52 Q50 60 18 52 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 2
  },
  'EH': { 
    upperLip: 'M15 49 Q50 44 85 49',
    lowerLip: 'M17 59 Q50 63 83 59', 
    innerMouth: 'M22 52 Q50 50 78 52 Q50 61 22 52 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 3
  },
  
  // O - rounded lips, protruded
  'O': { 
    upperLip: 'M35 45 Q50 40 65 45',
    lowerLip: 'M35 65 Q50 70 65 65', 
    innerMouth: 'M40 50 Q50 45 60 50 Q50 65 40 50 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 8
  },
  'OH': { 
    upperLip: 'M32 44 Q50 38 68 44',
    lowerLip: 'M32 66 Q50 72 68 66', 
    innerMouth: 'M38 49 Q50 43 62 49 Q50 67 38 49 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 10
  },
  
  // U - very small rounded opening
  'U': { 
    upperLip: 'M42 48 Q50 45 58 48',
    lowerLip: 'M42 62 Q50 65 58 62', 
    innerMouth: 'M45 52 Q50 50 55 52 Q50 60 45 52 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 2
  },
  'UH': { 
    upperLip: 'M40 47 Q50 44 60 47',
    lowerLip: 'M40 63 Q50 66 60 63', 
    innerMouth: 'M43 51 Q50 49 57 51 Q50 61 43 51 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 3
  },
  
  // Consonants - neutral but slightly open
  'C': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'slight',
    tongue: null,
    jawDrop: 1
  },
  'D': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'slight',
    tongue: 'tip',
    jawDrop: 1
  },
  'G': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'slight',
    tongue: 'back',
    jawDrop: 1
  },
  'K': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'slight',
    tongue: 'back',
    jawDrop: 1
  },
  'N': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'slight',
    tongue: 'tip',
    jawDrop: 1
  },
  'R': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'slight',
    tongue: 'curved',
    jawDrop: 1
  },
  'S': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'visible',
    tongue: 'groove',
    jawDrop: 0
  },
  'TH': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'visible',
    tongue: 'between',
    jawDrop: 1
  },
  'Y': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'slight',
    tongue: 'high',
    jawDrop: 1
  },
  'Z': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'visible',
    tongue: 'groove',
    jawDrop: 0
  },
  
  // F and V - lower lip touches upper teeth
  'F': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 55 Q50 52 75 55', 
    innerMouth: 'M30 53 Q50 51 70 53 Q50 57 30 53 Z',
    teeth: 'upper',
    tongue: null,
    jawDrop: 0
  },
  'V': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 55 Q50 52 75 55', 
    innerMouth: 'M30 53 Q50 51 70 53 Q50 57 30 53 Z',
    teeth: 'upper',
    tongue: null,
    jawDrop: 0
  },
  
  // L - tongue tip visible at teeth
  'L': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'visible',
    tongue: 'tip-out',
    jawDrop: 1
  },
  
  // M, B, P - lips pressed together
  'M': { 
    upperLip: 'M25 54 Q50 52 75 54',
    lowerLip: 'M25 56 Q50 58 75 56', 
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  'B': { 
    upperLip: 'M25 54 Q50 52 75 54',
    lowerLip: 'M25 56 Q50 58 75 56', 
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  'P': { 
    upperLip: 'M25 54 Q50 52 75 54',
    lowerLip: 'M25 56 Q50 58 75 56', 
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  
  // W and Q - rounded and protruded
  'W': { 
    upperLip: 'M38 46 Q50 42 62 46',
    lowerLip: 'M38 64 Q50 68 62 64', 
    innerMouth: 'M42 51 Q50 48 58 51 Q50 63 42 51 Z',
    teeth: 'hidden',
    tongue: 'back',
    jawDrop: 6
  },
  'Q': { 
    upperLip: 'M35 45 Q50 40 65 45',
    lowerLip: 'M35 65 Q50 70 65 65', 
    innerMouth: 'M40 50 Q50 45 60 50 Q50 65 40 50 Z',
    teeth: 'hidden',
    tongue: 'back',
    jawDrop: 8
  },
  
  // Rest and other positions
  'REST': { 
    upperLip: 'M25 52 Q50 50 75 52',
    lowerLip: 'M25 58 Q50 60 75 58', 
    innerMouth: 'M30 54 Q50 53 70 54 Q50 57 30 54 Z',
    teeth: 'hidden',
    tongue: 'rest',
    jawDrop: 0
  },
  'ER': { 
    upperLip: 'M25 51 Q50 49 75 51',
    lowerLip: 'M25 59 Q50 61 75 59', 
    innerMouth: 'M30 54 Q50 53 70 54 Q50 58 30 54 Z',
    teeth: 'hidden',
    tongue: 'curved',
    jawDrop: 1
  },
  'T': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'visible',
    tongue: 'tip',
    jawDrop: 1
  },
  'H': { 
    upperLip: 'M25 50 Q50 48 75 50',
    lowerLip: 'M25 60 Q50 62 75 60', 
    innerMouth: 'M30 53 Q50 52 70 53 Q50 59 30 53 Z',
    teeth: 'slight',
    tongue: 'low',
    jawDrop: 2
  },
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
        setAnimationPhase(prev => (prev + 1) % 8);
      }, 150);
      return () => clearInterval(interval);
    } else {
      setAnimationPhase(0);
    }
  }, [isAnimating]);

  const getTongueElement = () => {
    if (!currentShape.tongue) return null;
    
    const animOffset = isAnimating ? Math.sin(animationPhase * 0.5) * 2 : 0;
    
    switch (currentShape.tongue) {
      case 'tip':
        return <ellipse cx={50 + animOffset} cy="53" rx="4" ry="2" fill="#ff6b6b" opacity="0.8" />;
      case 'tip-out':
        return <ellipse cx={50 + animOffset} cy="48" rx="3" ry="2" fill="#ff6b6b" opacity="0.9" />;
      case 'between':
        return <ellipse cx={50 + animOffset} cy="50" rx="3" ry="1.5" fill="#ff6b6b" opacity="0.7" />;
      case 'curved':
        return <path d={`M${45 + animOffset} 55 Q50 52 ${55 + animOffset} 55`} stroke="#ff6b6b" strokeWidth="3" fill="none" opacity="0.8" />;
      case 'groove':
        return <path d={`M${48 + animOffset} 54 Q50 52 ${52 + animOffset} 54`} stroke="#ff6b6b" strokeWidth="2" fill="none" opacity="0.8" />;
      case 'high':
        return <ellipse cx={50 + animOffset} cy="52" rx="6" ry="2" fill="#ff6b6b" opacity="0.6" />;
      case 'back':
        return <ellipse cx={50} cy="56" rx="8" ry="3" fill="#ff6b6b" opacity="0.5" />;
      case 'low':
        return <ellipse cx={50} cy="57" rx="5" ry="2" fill="#ff6b6b" opacity="0.6" />;
      case 'rest':
        return <ellipse cx="50" cy="56" rx="6" ry="2" fill="#ff6b6b" opacity="0.4" />;
      default:
        return null;
    }
  };

  const getTeethElement = () => {
    switch (currentShape.teeth) {
      case 'visible':
        return (
          <g>
            <rect x="40" y="48" width="20" height="4" fill="white" stroke="#ddd" strokeWidth="0.5" rx="1" />
            <rect x="40" y="58" width="20" height="4" fill="white" stroke="#ddd" strokeWidth="0.5" rx="1" />
          </g>
        );
      case 'upper':
        return <rect x="42" y="48" width="16" height="3" fill="white" stroke="#ddd" strokeWidth="0.5" rx="1" />;
      case 'slight':
        return <rect x="45" y="50" width="10" height="2" fill="white" stroke="#ddd" strokeWidth="0.3" rx="0.5" opacity="0.6" />;
      default:
        return null;
    }
  };

  const animationScale = isAnimating ? 1 + Math.sin(animationPhase * 0.8) * 0.08 : 1;
  const jawOffset = currentShape.jawDrop + (isAnimating ? Math.sin(animationPhase) * 1 : 0);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg 
        width="300" 
        height="200" 
        viewBox="0 0 100 80" 
        className="transition-transform duration-300"
        style={{ transform: `scale(${animationScale})` }}
      >
        {/* Teeth (behind mouth) */}
        {getTeethElement()}
        
        {/* Inner mouth cavity */}
        {currentShape.innerMouth && (
          <path
            d={currentShape.innerMouth}
            fill="#2a1810"
            className="transition-all duration-500"
            transform={`translate(0, ${jawOffset * 0.3})`}
          />
        )}
        
        {/* Tongue */}
        <g transform={`translate(0, ${jawOffset * 0.4})`}>
          {getTongueElement()}
        </g>
        
        {/* Lower lip */}
        <path
          d={currentShape.lowerLip}
          stroke="#d4a574"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className="transition-all duration-500"
          transform={`translate(0, ${jawOffset})`}
        />
        
        {/* Upper lip */}
        <path
          d={currentShape.upperLip}
          stroke="#d4a574"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        
        {/* Lip highlights */}
        <path
          d={currentShape.upperLip}
          stroke="#f4c2a1"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
          className="transition-all duration-500"
        />
        <path
          d={currentShape.lowerLip}
          stroke="#f4c2a1"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.8"
          className="transition-all duration-500"
          transform={`translate(0, ${jawOffset})`}
        />
      </svg>
      
      {/* Phoneme info */}
      <div className="mt-4 text-center">
        <div className="text-3xl font-bold text-primary mb-1">{phoneme}</div>
        <div className="text-sm text-muted-foreground">
          {isAnimating ? '🗣️ Speaking...' : '👄 Ready'}
        </div>
      </div>
    </div>
  );
};

export default AnimatedLips;