import React, { useEffect, useState } from 'react';

interface AnimatedLipsProps {
  phoneme: string;
  isAnimating?: boolean;
  className?: string;
}

// Map phonemes to realistic mouth images
const phonemeImages: { [key: string]: string } = {
  // Rest/closed position
  'REST': '/lovable-uploads/fe78d736-c1df-4cef-baa4-49d4b4ce1497.png',
  
  // Vowel sounds
  'A': '/lovable-uploads/cf41e91c-0d20-4de8-b614-0f2989a78eef.png',
  'AH': '/lovable-uploads/7ad40a17-a62a-4a62-9ffa-1eddcb2c88c9.png',
  'E': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  'EH': '/lovable-uploads/21a485f6-13a4-44af-bd9f-0e88eed4cabe.png',
  'I': '/lovable-uploads/4da68f6d-66e5-4ce9-9264-ad07085bc0ca.png',
  'O': '/lovable-uploads/34c72fd0-7acb-4e9b-a4cf-f7b77f83fbff.png',
  'OH': '/lovable-uploads/34c72fd0-7acb-4e9b-a4cf-f7b77f83fbff.png',
  'U': '/lovable-uploads/30720bc1-7fed-41bc-8e3b-8bdef0cf37d7.png',
  'UH': '/lovable-uploads/30720bc1-7fed-41bc-8e3b-8bdef0cf37d7.png',
  
  // Consonants with teeth visible
  'S': '/lovable-uploads/6fab2811-5a1d-4476-945f-3b242ed919e5.png',
  'Z': '/lovable-uploads/6fab2811-5a1d-4476-945f-3b242ed919e5.png',
  'TH': '/lovable-uploads/6fab2811-5a1d-4476-945f-3b242ed919e5.png',
  'F': '/lovable-uploads/6fab2811-5a1d-4476-945f-3b242ed919e5.png',
  'V': '/lovable-uploads/6fab2811-5a1d-4476-945f-3b242ed919e5.png',
  'T': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  'D': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  'N': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  'L': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  
  // Closed lips for M, B, P sounds
  'M': '/lovable-uploads/30720bc1-7fed-41bc-8e3b-8bdef0cf37d7.png',
  'B': '/lovable-uploads/30720bc1-7fed-41bc-8e3b-8bdef0cf37d7.png',
  'P': '/lovable-uploads/30720bc1-7fed-41bc-8e3b-8bdef0cf37d7.png',
  
  // Wide open sounds
  'C': '/lovable-uploads/4f31a9e8-ec80-499e-ae84-30b7625a8e40.png',
  'G': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  'K': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  'R': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  'H': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
  'Y': '/lovable-uploads/4da68f6d-66e5-4ce9-9264-ad07085bc0ca.png',
  'W': '/lovable-uploads/30720bc1-7fed-41bc-8e3b-8bdef0cf37d7.png',
  'Q': '/lovable-uploads/34c72fd0-7acb-4e9b-a4cf-f7b77f83fbff.png',
  'ER': '/lovable-uploads/218c2284-1af8-4094-945a-6b0bac61bd21.png',
};

const AnimatedLips: React.FC<AnimatedLipsProps> = ({ 
  phoneme, 
  isAnimating = false, 
  className = "" 
}) => {
  const [currentImage, setCurrentImage] = useState(phonemeImages['REST']);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const targetImage = phonemeImages[phoneme as keyof typeof phonemeImages] || phonemeImages['REST'];
    setCurrentImage(targetImage);
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

  const animationScale = isAnimating ? 1 + Math.sin(animationPhase * 0.8) * 0.05 : 1;
  const animationRotation = isAnimating ? Math.sin(animationPhase * 0.6) * 2 : 0;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className="relative transition-transform duration-300"
        style={{ 
          transform: `scale(${animationScale}) rotate(${animationRotation}deg)` 
        }}
      >
        <img 
          src={currentImage}
          alt={`Mouth position for phoneme ${phoneme}`}
          className="w-80 h-60 object-contain rounded-lg shadow-lg"
          style={{
            filter: isAnimating ? 'brightness(1.1) contrast(1.05)' : 'none',
            transition: 'filter 0.3s ease'
          }}
        />
        
        {/* Animation overlay effect */}
        {isAnimating && (
          <div 
            className="absolute inset-0 rounded-lg"
            style={{
              background: `radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)`,
              opacity: Math.sin(animationPhase * 0.8) * 0.3 + 0.3
            }}
          />
        )}
      </div>
      
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
