import React, { useEffect, useState } from 'react';

interface AnimatedLipsProps {
  phoneme: string;
  isAnimating?: boolean;
  className?: string;
}

// Map phonemes to realistic mouth images
const phonemeImages: { [key: string]: string } = {
  // Wide open mouth for A sounds
  'A': '/lovable-uploads/a8513aa0-7538-4cf1-9afa-afb8a878e3fc.png',
  'AH': '/lovable-uploads/e85ce56a-ad60-4c4f-adc8-d97de58f5c68.png',
  
  // Slightly open mouth for E and I sounds  
  'E': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'EH': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'I': '/lovable-uploads/6b6ce031-a78c-46ef-b924-5adb1a9aff4b.png',
  
  // Very open mouth for O sounds
  'O': '/lovable-uploads/f0e177a6-d8de-402b-a1dd-589f1acea845.png',
  'OH': '/lovable-uploads/db4e9e5a-cb12-40eb-bf59-1aa51a7f795b.png',
  
  // Small rounded opening for U sounds
  'U': '/lovable-uploads/edbc7e89-ab7a-4aa4-8712-d447379bdbcc.png',
  'UH': '/lovable-uploads/edbc7e89-ab7a-4aa4-8712-d447379bdbcc.png',
  
  // Consonants with teeth visible
  'S': '/lovable-uploads/1f5fb02b-6f34-4736-8f3f-3441aa176cdc.png',
  'Z': '/lovable-uploads/1f5fb02b-6f34-4736-8f3f-3441aa176cdc.png',
  'TH': '/lovable-uploads/1f5fb02b-6f34-4736-8f3f-3441aa176cdc.png',
  'F': '/lovable-uploads/1f5fb02b-6f34-4736-8f3f-3441aa176cdc.png',
  'V': '/lovable-uploads/1f5fb02b-6f34-4736-8f3f-3441aa176cdc.png',
  'T': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'D': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'N': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'L': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  
  // Closed lips for M, B, P sounds
  'M': '/lovable-uploads/61e3a1ba-db36-475e-8d49-12371d0dbe3b.png',
  'B': '/lovable-uploads/61e3a1ba-db36-475e-8d49-12371d0dbe3b.png',
  'P': '/lovable-uploads/61e3a1ba-db36-475e-8d49-12371d0dbe3b.png',
  
  // Other consonants - neutral position
  'C': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'G': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'K': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'R': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'H': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'Y': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  'W': '/lovable-uploads/edbc7e89-ab7a-4aa4-8712-d447379bdbcc.png',
  'Q': '/lovable-uploads/f0e177a6-d8de-402b-a1dd-589f1acea845.png',
  'ER': '/lovable-uploads/74f8c0b0-b693-4818-b02b-e8f25cd7557c.png',
  
  // Default rest position
  'REST': '/lovable-uploads/61e3a1ba-db36-475e-8d49-12371d0dbe3b.png',
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
