import React, { useEffect, useState } from 'react';

interface AnimatedLipsProps {
  phoneme: string;
  isAnimating?: boolean;
  className?: string;
}

// Enhanced realistic mouth shapes with proper lip proportions and tongue
const phonemeShapes = {
  // A and I - wide open mouth
  'A': { 
    mouth: 'M20 48 Q15 46 25 44 Q35 42 50 42 Q65 42 75 44 Q85 46 80 48 Q75 50 65 52 Q50 53 35 52 Q25 50 20 48 Z M22 58 Q17 60 27 62 Q37 64 50 65 Q63 64 73 62 Q83 60 78 58 Q73 56 63 54 Q50 53 37 54 Q27 56 22 58 Z',
    innerMouth: 'M30 48 Q50 45 70 48 Q65 58 50 60 Q35 58 30 48 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 8
  },
  'I': { 
    mouth: 'M25 49 Q20 48 30 47 Q40 46 50 46 Q60 46 70 47 Q80 48 75 49 Q70 50 60 51 Q50 51 40 51 Q30 50 25 49 Z M22 56 Q17 58 27 59 Q37 60 50 61 Q63 60 73 59 Q83 58 78 56 Q73 54 63 53 Q50 52 37 53 Q27 54 22 56 Z',
    innerMouth: 'M32 48 Q50 47 68 48 Q65 54 50 55 Q35 54 32 48 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 4
  },
  'AH': { 
    mouth: 'M22 48 Q17 47 27 45 Q37 43 50 43 Q63 43 73 45 Q83 47 78 48 Q73 50 63 51 Q50 52 37 51 Q27 50 22 48 Z M20 60 Q15 62 25 64 Q35 66 50 67 Q65 66 75 64 Q85 62 80 60 Q75 58 65 56 Q50 55 35 56 Q25 58 20 60 Z',
    innerMouth: 'M31 48 Q50 46 69 48 Q65 57 50 59 Q35 57 31 48 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 6
  },
  
  // E - wide smile
  'E': { 
    mouth: 'M15 50 Q10 49 20 48 Q30 47 50 47 Q70 47 80 48 Q90 49 85 50 Q80 51 70 52 Q50 52 30 52 Q20 51 15 50 Z M12 56 Q7 58 17 59 Q27 60 50 61 Q73 60 83 59 Q93 58 88 56 Q83 54 73 53 Q50 52 27 53 Q17 54 12 56 Z',
    innerMouth: 'M25 50 Q50 49 75 50 Q70 55 50 56 Q30 55 25 50 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 2
  },
  'EH': { 
    mouth: 'M18 50 Q13 49 23 48 Q33 47 50 47 Q67 47 77 48 Q87 49 82 50 Q77 51 67 52 Q50 52 33 52 Q23 51 18 50 Z M15 56 Q10 58 20 59 Q30 60 50 61 Q70 60 80 59 Q90 58 85 56 Q80 54 70 53 Q50 52 30 53 Q20 54 15 56 Z',
    innerMouth: 'M27 49 Q50 48 73 49 Q68 55 50 56 Q32 55 27 49 Z',
    teeth: 'visible',
    tongue: null,
    jawDrop: 3
  },
  
  // O - rounded lips
  'O': { 
    mouth: 'M38 45 Q33 44 42 43 Q47 42 50 42 Q53 42 58 43 Q67 44 62 45 Q58 46 53 47 Q50 47 47 47 Q42 46 38 45 Z M35 57 Q30 59 40 61 Q45 62 50 62 Q55 62 60 61 Q70 59 65 57 Q60 55 55 54 Q50 53 45 54 Q40 55 35 57 Z',
    innerMouth: 'M42 45 Q50 43 58 45 Q55 52 50 53 Q45 52 42 45 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 8
  },
  'OH': { 
    mouth: 'M35 44 Q30 43 40 42 Q45 41 50 41 Q55 41 60 42 Q70 43 65 44 Q60 45 55 46 Q50 46 45 46 Q40 45 35 44 Z M32 58 Q27 60 37 62 Q42 63 50 63 Q58 63 63 62 Q73 60 68 58 Q63 56 58 55 Q50 54 42 55 Q37 56 32 58 Z',
    innerMouth: 'M40 44 Q50 41 60 44 Q57 54 50 56 Q43 54 40 44 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 10
  },
  
  // U - small rounded opening
  'U': { 
    mouth: 'M43 48 Q40 47 45 46 Q47 46 50 46 Q53 46 55 46 Q60 47 57 48 Q55 49 53 49 Q50 49 47 49 Q45 49 43 48 Z M41 54 Q38 56 43 57 Q46 58 50 58 Q54 58 57 57 Q62 56 59 54 Q57 52 54 51 Q50 50 46 51 Q43 52 41 54 Z',
    innerMouth: 'M46 48 Q50 47 54 48 Q52 52 50 53 Q48 52 46 48 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 2
  },
  'UH': { 
    mouth: 'M41 47 Q38 46 43 45 Q46 45 50 45 Q54 45 57 45 Q62 46 59 47 Q57 48 54 48 Q50 48 46 48 Q43 48 41 47 Z M39 55 Q36 57 41 58 Q44 59 50 59 Q56 59 59 58 Q64 57 61 55 Q59 53 56 52 Q50 51 44 52 Q41 53 39 55 Z',
    innerMouth: 'M45 47 Q50 46 55 47 Q53 51 50 52 Q47 51 45 47 Z',
    teeth: 'hidden',
    tongue: null,
    jawDrop: 3
  },
  
  // Consonants - neutral position
  'C': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: null,
    jawDrop: 1
  },
  'D': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'tip',
    jawDrop: 1
  },
  'G': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'back',
    jawDrop: 1
  },
  'K': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'back',
    jawDrop: 1
  },
  'N': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'tip',
    jawDrop: 1
  },
  'R': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'curved',
    jawDrop: 1
  },
  'S': { 
    mouth: 'M30 51 Q25 50 35 49 Q42 49 50 49 Q58 49 65 49 Q75 50 70 51 Q65 52 58 52 Q50 52 42 52 Q35 52 30 51 Z M27 55 Q22 57 32 58 Q39 59 50 59 Q61 59 68 58 Q78 57 73 55 Q68 53 61 52 Q50 51 39 52 Q32 53 27 55 Z',
    innerMouth: 'M37 51 Q50 50 63 51 Q58 53 50 53 Q42 53 37 51 Z',
    teeth: 'visible',
    tongue: 'groove',
    jawDrop: 0
  },
  'TH': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'visible',
    tongue: 'between',
    jawDrop: 1
  },
  'Y': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'slight',
    tongue: 'high',
    jawDrop: 1
  },
  'Z': { 
    mouth: 'M30 51 Q25 50 35 49 Q42 49 50 49 Q58 49 65 49 Q75 50 70 51 Q65 52 58 52 Q50 52 42 52 Q35 52 30 51 Z M27 55 Q22 57 32 58 Q39 59 50 59 Q61 59 68 58 Q78 57 73 55 Q68 53 61 52 Q50 51 39 52 Q32 53 27 55 Z',
    innerMouth: 'M37 51 Q50 50 63 51 Q58 53 50 53 Q42 53 37 51 Z',
    teeth: 'visible',
    tongue: 'groove',
    jawDrop: 0
  },
  
  // F and V - lower lip touches upper teeth
  'F': { 
    mouth: 'M28 51 Q23 50 33 49 Q40 49 50 49 Q60 49 67 49 Q77 50 72 51 Q67 52 60 52 Q50 52 40 52 Q33 52 28 51 Z M25 55 Q20 57 30 58 Q37 59 50 59 Q63 59 70 58 Q80 57 75 55 Q70 53 63 52 Q50 51 37 52 Q30 53 25 55 Z',
    innerMouth: 'M35 51 Q50 50 65 51 Q60 53 50 53 Q40 53 35 51 Z',
    teeth: 'upper',
    tongue: null,
    jawDrop: 0
  },
  'V': { 
    mouth: 'M28 51 Q23 50 33 49 Q40 49 50 49 Q60 49 67 49 Q77 50 72 51 Q67 52 60 52 Q50 52 40 52 Q33 52 28 51 Z M25 55 Q20 57 30 58 Q37 59 50 59 Q63 59 70 58 Q80 57 75 55 Q70 53 63 52 Q50 51 37 52 Q30 53 25 55 Z',
    innerMouth: 'M35 51 Q50 50 65 51 Q60 53 50 53 Q40 53 35 51 Z',
    teeth: 'upper',
    tongue: null,
    jawDrop: 0
  },
  
  // L - tongue tip visible
  'L': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'visible',
    tongue: 'tip-out',
    jawDrop: 1
  },
  
  // M, B, P - lips pressed together
  'M': { 
    mouth: 'M30 51 Q25 50 35 49 Q42 49 50 49 Q58 49 65 49 Q75 50 70 51 Q65 52 58 52 Q50 52 42 52 Q35 52 30 51 Z',
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  'B': { 
    mouth: 'M30 51 Q25 50 35 49 Q42 49 50 49 Q58 49 65 49 Q75 50 70 51 Q65 52 58 52 Q50 52 42 52 Q35 52 30 51 Z',
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  'P': { 
    mouth: 'M30 51 Q25 50 35 49 Q42 49 50 49 Q58 49 65 49 Q75 50 70 51 Q65 52 58 52 Q50 52 42 52 Q35 52 30 51 Z',
    innerMouth: null,
    teeth: 'hidden',
    tongue: null,
    jawDrop: 0
  },
  
  // W and Q - rounded and protruded
  'W': { 
    mouth: 'M40 46 Q35 45 43 44 Q46 43 50 43 Q54 43 57 44 Q65 45 60 46 Q57 47 54 47 Q50 47 46 47 Q43 47 40 46 Z M37 55 Q32 57 40 58 Q43 59 50 59 Q57 59 60 58 Q68 57 63 55 Q60 53 57 52 Q50 51 43 52 Q40 53 37 55 Z',
    innerMouth: 'M44 46 Q50 44 56 46 Q54 51 50 52 Q46 51 44 46 Z',
    teeth: 'hidden',
    tongue: 'back',
    jawDrop: 6
  },
  'Q': { 
    mouth: 'M38 45 Q33 44 42 43 Q47 42 50 42 Q53 42 58 43 Q67 44 62 45 Q58 46 53 47 Q50 47 47 47 Q42 46 38 45 Z M35 57 Q30 59 40 61 Q45 62 50 62 Q55 62 60 61 Q70 59 65 57 Q60 55 55 54 Q50 53 45 54 Q40 55 35 57 Z',
    innerMouth: 'M42 45 Q50 43 58 45 Q55 52 50 53 Q45 52 42 45 Z',
    teeth: 'hidden',
    tongue: 'back',
    jawDrop: 8
  },
  
  // Rest and other positions
  'REST': { 
    mouth: 'M30 51 Q25 50 35 49 Q42 49 50 49 Q58 49 65 49 Q75 50 70 51 Q65 52 58 52 Q50 52 42 52 Q35 52 30 51 Z M27 55 Q22 57 32 58 Q39 59 50 59 Q61 59 68 58 Q78 57 73 55 Q68 53 61 52 Q50 51 39 52 Q32 53 27 55 Z',
    innerMouth: 'M37 51 Q50 50 63 51 Q58 53 50 53 Q42 53 37 51 Z',
    teeth: 'hidden',
    tongue: 'rest',
    jawDrop: 0
  },
  'ER': { 
    mouth: 'M29 50 Q24 49 34 48 Q41 48 50 48 Q59 48 66 48 Q76 49 71 50 Q66 51 59 51 Q50 51 41 51 Q34 51 29 50 Z M26 56 Q21 58 31 59 Q38 60 50 60 Q62 60 69 59 Q79 58 74 56 Q69 54 62 53 Q50 52 38 53 Q31 54 26 56 Z',
    innerMouth: 'M36 50 Q50 49 64 50 Q59 53 50 53 Q41 53 36 50 Z',
    teeth: 'hidden',
    tongue: 'curved',
    jawDrop: 1
  },
  'T': { 
    mouth: 'M28 50 Q23 49 33 48 Q40 48 50 48 Q60 48 67 48 Q77 49 72 50 Q67 51 60 51 Q50 51 40 51 Q33 51 28 50 Z M25 56 Q20 58 30 59 Q37 60 50 60 Q63 60 70 59 Q80 58 75 56 Q70 54 63 53 Q50 52 37 53 Q30 54 25 56 Z',
    innerMouth: 'M35 50 Q50 49 65 50 Q60 53 50 54 Q40 53 35 50 Z',
    teeth: 'visible',
    tongue: 'tip',
    jawDrop: 1
  },
  'H': { 
    mouth: 'M26 50 Q21 49 31 48 Q38 48 50 48 Q62 48 69 48 Q79 49 74 50 Q69 52 62 53 Q50 53 38 53 Q31 52 26 50 Z M23 58 Q18 60 28 61 Q35 62 50 62 Q65 62 72 61 Q82 60 77 58 Q72 56 65 55 Q50 54 35 55 Q28 56 23 58 Z',
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
    
    const animOffset = isAnimating ? Math.sin(animationPhase * 0.8) * 3 : 0;
    const verticalOffset = isAnimating ? Math.cos(animationPhase * 0.6) * 1 : 0;
    
    switch (currentShape.tongue) {
      case 'tip':
        return (
          <g>
            <ellipse cx={49 + animOffset} cy={51 + verticalOffset} rx="5" ry="3" fill="#e74c3c" opacity="0.9" />
            <circle cx={49 + animOffset} cy={50 + verticalOffset} r="2" fill="#c0392b" opacity="0.8" />
          </g>
        );
      case 'tip-out':
        return (
          <g>
            <ellipse cx={50 + animOffset} cy={46 + verticalOffset} rx="4" ry="2.5" fill="#e74c3c" opacity="1" />
            <circle cx={50 + animOffset} cy={45 + verticalOffset} r="1.5" fill="#c0392b" opacity="0.9" />
          </g>
        );
      case 'between':
        return (
          <g>
            <ellipse cx={50 + animOffset} cy={48 + verticalOffset} rx="4" ry="2" fill="#e74c3c" opacity="0.8" />
            <path d={`M${48 + animOffset} ${48 + verticalOffset} Q${50 + animOffset} ${46 + verticalOffset} ${52 + animOffset} ${48 + verticalOffset}`} 
                  stroke="#c0392b" strokeWidth="1.5" fill="none" opacity="0.9" />
          </g>
        );
      case 'curved':
        return (
          <g>
            <path d={`M${43 + animOffset} ${54 + verticalOffset} Q${50} ${50 + verticalOffset} ${57 + animOffset} ${54 + verticalOffset}`} 
                  stroke="#e74c3c" strokeWidth="4" fill="none" opacity="0.9" />
            <path d={`M${44 + animOffset} ${53 + verticalOffset} Q${50} ${49 + verticalOffset} ${56 + animOffset} ${53 + verticalOffset}`} 
                  stroke="#c0392b" strokeWidth="2" fill="none" opacity="0.8" />
          </g>
        );
      case 'groove':
        return (
          <g>
            <path d={`M${46 + animOffset} ${52 + verticalOffset} Q${50} ${50 + verticalOffset} ${54 + animOffset} ${52 + verticalOffset}`} 
                  stroke="#e74c3c" strokeWidth="3" fill="none" opacity="0.9" />
            <ellipse cx={50} cy={51 + verticalOffset} rx="4" ry="1.5" fill="#e74c3c" opacity="0.6" />
          </g>
        );
      case 'high':
        return (
          <g>
            <ellipse cx={50 + animOffset} cy={50 + verticalOffset} rx="7" ry="2.5" fill="#e74c3c" opacity="0.7" />
            <ellipse cx={50 + animOffset} cy={49 + verticalOffset} rx="5" ry="1.5" fill="#c0392b" opacity="0.6" />
          </g>
        );
      case 'back':
        return (
          <g>
            <ellipse cx={50} cy={55 + verticalOffset} rx="9" ry="4" fill="#e74c3c" opacity="0.6" />
            <ellipse cx={50} cy={54 + verticalOffset} rx="6" ry="2.5" fill="#c0392b" opacity="0.5" />
          </g>
        );
      case 'low':
        return (
          <g>
            <ellipse cx={50 + animOffset} cy={56 + verticalOffset} rx="6" ry="2.5" fill="#e74c3c" opacity="0.7" />
            <ellipse cx={50 + animOffset} cy={55 + verticalOffset} rx="4" ry="1.5" fill="#c0392b" opacity="0.6" />
          </g>
        );
      case 'rest':
        return (
          <g>
            <ellipse cx="50" cy={55 + verticalOffset * 0.5} rx="7" ry="2" fill="#e74c3c" opacity="0.5" />
            <ellipse cx="50" cy={54 + verticalOffset * 0.5} rx="5" ry="1" fill="#c0392b" opacity="0.4" />
          </g>
        );
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