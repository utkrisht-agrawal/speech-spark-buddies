import React, { useEffect, useState } from 'react';

interface AnimatedLipsProps {
  phoneme: string;
  isAnimating?: boolean;
  className?: string;
}

// Enhanced realistic mouth shapes with connected lips
const phonemeShapes = {
  // A and I - wide open mouth
  'A': { 
    mouth: 'M20 50 Q15 45 25 42 Q35 40 50 41 Q65 40 75 42 Q85 45 80 50 Q75 58 65 62 Q50 65 35 62 Q25 58 20 50 Z',
    innerMouth: 'M30 48 Q50 45 70 48 Q65 58 50 60 Q35 58 30 48 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 8
  },
  'I': { 
    mouth: 'M25 50 Q20 47 30 45 Q40 44 50 44 Q60 44 70 45 Q80 47 75 50 Q70 55 60 56 Q50 57 40 56 Q30 55 25 50 Z',
    innerMouth: 'M32 48 Q50 47 68 48 Q65 54 50 55 Q35 54 32 48 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 4
  },
  'AH': { 
    mouth: 'M22 50 Q17 46 27 43 Q37 41 50 42 Q63 41 73 43 Q83 46 78 50 Q73 57 63 60 Q50 62 37 60 Q27 57 22 50 Z',
    innerMouth: 'M31 48 Q50 46 69 48 Q65 57 50 59 Q35 57 31 48 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 6
  },
  
  // E - wide smile
  'E': { 
    mouth: 'M15 52 Q10 50 20 48 Q30 47 50 47 Q70 47 80 48 Q90 50 85 52 Q80 56 70 57 Q50 58 30 57 Q20 56 15 52 Z',
    innerMouth: 'M25 50 Q50 49 75 50 Q70 55 50 56 Q30 55 25 50 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 2
  },
  'EH': { 
    mouth: 'M18 51 Q13 49 23 47 Q33 46 50 46 Q67 46 77 47 Q87 49 82 51 Q77 56 67 57 Q50 58 33 57 Q23 56 18 51 Z',
    innerMouth: 'M27 49 Q50 48 73 49 Q68 55 50 56 Q32 55 27 49 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 3
  },
  
  // O - rounded lips
  'O': { 
    mouth: 'M38 46 Q33 42 42 40 Q47 39 50 39 Q53 39 58 40 Q67 42 62 46 Q58 54 53 56 Q50 57 47 56 Q42 54 38 46 Z',
    innerMouth: 'M42 45 Q50 43 58 45 Q55 52 50 53 Q45 52 42 45 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 8
  },
  'OH': { 
    mouth: 'M35 45 Q30 40 40 38 Q45 37 50 37 Q55 37 60 38 Q70 40 65 45 Q60 55 55 58 Q50 59 45 58 Q40 55 35 45 Z',
    innerMouth: 'M40 44 Q50 41 60 44 Q57 54 50 56 Q43 54 40 44 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 10
  },
  
  // U - small rounded opening
  'U': { 
    mouth: 'M43 49 Q40 47 45 46 Q47 45 50 45 Q53 45 55 46 Q60 47 57 49 Q55 53 53 54 Q50 55 47 54 Q45 53 43 49 Z',
    innerMouth: 'M46 48 Q50 47 54 48 Q52 52 50 53 Q48 52 46 48 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 2
  },
  'UH': { 
    mouth: 'M41 48 Q38 46 43 45 Q46 44 50 44 Q54 44 57 45 Q62 46 59 48 Q57 52 54 53 Q50 54 46 53 Q43 52 41 48 Z',
    innerMouth: 'M45 47 Q50 46 55 47 Q53 51 50 52 Q47 51 45 47 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 3
  },
  
  // Consonants - neutral position
  'C': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: null,
    jawDrop: 1
  },
  'D': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'tip',
    jawDrop: 1
  },
  'G': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'back',
    jawDrop: 1
  },
  'K': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'back',
    jawDrop: 1
  },
  'N': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'tip',
    jawDrop: 1
  },
  'R': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'curved',
    jawDrop: 1
  },
  'S': { 
    mouth: 'M30 52 Q25 50 35 49 Q42 48 50 48 Q58 48 65 49 Q75 50 70 52 Q65 54 58 54 Q50 54 42 54 Q35 54 30 52 Z',
    innerMouth: 'M37 51 Q50 50 63 51 Q58 53 50 53 Q42 53 37 51 Z',
    teeth: 'visible',
    tongue: 'groove',
    jawDrop: 0
  },
  'TH': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'visible',
    tongue: 'between',
    jawDrop: 1
  },
  'Y': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'high',
    jawDrop: 1
  },
  'Z': { 
    mouth: 'M30 52 Q25 50 35 49 Q42 48 50 48 Q58 48 65 49 Q75 50 70 52 Q65 54 58 54 Q50 54 42 54 Q35 54 30 52 Z',
    innerMouth: 'M37 51 Q50 50 63 51 Q58 53 50 53 Q42 53 37 51 Z',
    teeth: 'visible',
    tongue: 'groove',
    jawDrop: 0
  },
  
  // F and V - lower lip touches upper teeth
  'F': { 
    mouth: 'M28 52 Q23 50 33 49 Q40 48 50 48 Q60 48 67 49 Q77 50 72 52 Q67 54 60 54 Q50 54 40 54 Q33 54 28 52 Z',
    innerMouth: 'M35 51 Q50 50 65 51 Q60 53 50 53 Q40 53 35 51 Z',
    teeth: 'upper',
    tongue: null,
    jawDrop: 0
  },
  'V': { 
    mouth: 'M28 52 Q23 50 33 49 Q40 48 50 48 Q60 48 67 49 Q77 50 72 52 Q67 54 60 54 Q50 54 40 54 Q33 54 28 52 Z',
    innerMouth: 'M35 51 Q50 50 65 51 Q60 53 50 53 Q40 53 35 51 Z',
    teeth: 'upper',
    tongue: null,
    jawDrop: 0
  },
  
  // L - tongue tip visible
  'L': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'visible',
    tongue: 'tip-out',
    jawDrop: 1
  },
  
  // M, B, P - lips pressed together
  'M': { 
    mouth: 'M30 52 Q25 51 35 50 Q42 49 50 49 Q58 49 65 50 Q75 51 70 52 Q65 53 58 53 Q50 53 42 53 Q35 53 30 52 Z',
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  'B': { 
    mouth: 'M30 52 Q25 51 35 50 Q42 49 50 49 Q58 49 65 50 Q75 51 70 52 Q65 53 58 53 Q50 53 42 53 Q35 53 30 52 Z',
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  'P': { 
    mouth: 'M30 52 Q25 51 35 50 Q42 49 50 49 Q58 49 65 50 Q75 51 70 52 Q65 53 58 53 Q50 53 42 53 Q35 53 30 52 Z',
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  
  // W and Q - rounded and protruded
  'W': { 
    mouth: 'M40 47 Q35 44 43 42 Q46 41 50 41 Q54 41 57 42 Q65 44 60 47 Q57 52 54 54 Q50 55 46 54 Q43 52 40 47 Z',
    innerMouth: 'M44 46 Q50 44 56 46 Q54 51 50 52 Q46 51 44 46 Z',
    teeth: 'hidden',
    tongue: 'back',
    jawDrop: 6
  },
  'Q': { 
    mouth: 'M38 46 Q33 42 42 40 Q47 39 50 39 Q53 39 58 40 Q67 42 62 46 Q58 54 53 56 Q50 57 47 56 Q42 54 38 46 Z',
    innerMouth: 'M42 45 Q50 43 58 45 Q55 52 50 53 Q45 52 42 45 Z',
    teeth: 'hidden',
    tongue: 'back',
    jawDrop: 8
  },
  
  // Rest and other positions
  'REST': { 
    mouth: 'M30 52 Q25 51 35 50 Q42 49 50 49 Q58 49 65 50 Q75 51 70 52 Q65 54 58 54 Q50 54 42 54 Q35 54 30 52 Z',
    innerMouth: 'M37 51 Q50 50 63 51 Q58 53 50 53 Q42 53 37 51 Z',
    teeth: 'hidden',
    tongue: 'rest',
    jawDrop: 0
  },
  'ER': { 
    mouth: 'M29 51 Q24 50 34 49 Q41 48 50 48 Q59 48 66 49 Q76 50 71 51 Q66 53 59 54 Q50 54 41 54 Q34 53 29 51 Z',
    innerMouth: 'M36 50 Q50 49 64 50 Q59 53 50 53 Q41 53 36 50 Z',
    teeth: 'hidden',
    tongue: 'curved',
    jawDrop: 1
  },
  'T': { 
    mouth: 'M28 51 Q23 49 33 48 Q40 47 50 47 Q60 47 67 48 Q77 49 72 51 Q67 54 60 55 Q50 55 40 55 Q33 54 28 51 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'visible',
    tongue: 'tip',
    jawDrop: 1
  },
  'H': { 
    mouth: 'M26 51 Q21 49 31 48 Q38 47 50 47 Q62 47 69 48 Q79 49 74 51 Q69 55 62 56 Q50 56 38 56 Q31 55 26 51 Z',
    innerMouth: 'M33 50 Q50 49 67 50 Q62 54 50 55 Q38 54 33 50 Z',
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
        
        {/* Main mouth shape */}
        <path
          d={currentShape.mouth}
          fill="#d4a574"
          stroke="#b8956a"
          strokeWidth="2"
          className="transition-all duration-500"
          transform={`translate(0, ${jawOffset * 0.2})`}
        />
        
        {/* Mouth highlights */}
        <path
          d={currentShape.mouth}
          fill="none"
          stroke="#f4c2a1"
          strokeWidth="1"
          opacity="0.6"
          className="transition-all duration-500"
          transform={`translate(0, ${jawOffset * 0.2})`}
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