export interface PhonemeMatch {
  phoneme: string;
  matchType: 'exact' | 'stress-mismatch' | 'mismatch';
  color: 'green' | 'orange' | 'red';
}

export function comparePhonemes(spokenPhonemes: string, targetPhonemes: string): PhonemeMatch[] {
  // Split phonemes by space and filter out empty strings
  const spoken = spokenPhonemes.replaceAll('   ', ' <space> ').split(' ').filter(p => p.trim() !== '');
  const target = targetPhonemes.replaceAll('   ', ' <space> ').split(' ').filter(p => p.trim() !== '');
  
  const results: PhonemeMatch[] = [];
  
  // Process each target phoneme
  for (let i = 0; i < target.length; i++) {
    const targetPhoneme = target[i];
    const spokenPhoneme = spoken[i] || ''; // Handle case where spoken has fewer phonemes
    
    let matchType: 'exact' | 'stress-mismatch' | 'mismatch';
    let color: 'green' | 'orange' | 'red';
    
    if (targetPhoneme === spokenPhoneme) {
      // Exact match
      matchType = 'exact';
      color = 'green';
    } else {
      // Extract base phoneme (without stress numbers)
      const targetBase = targetPhoneme.replace(/[0-9]/g, '');
      const spokenBase = spokenPhoneme.replace(/[0-9]/g, '');
      
      if (targetBase === spokenBase) {
        // Same phoneme but different stress
        matchType = 'stress-mismatch';
        color = 'orange';
      } else {
        // Completely different phoneme
        matchType = 'mismatch';
        color = 'red';
      }
    }
    
    results.push({
      phoneme: targetPhoneme,
      matchType,
      color
    });
  }
  
  return results;
}

export function getPhonemeStyles(color: 'green' | 'orange' | 'red'): string {
  switch (color) {
    case 'green':
      return 'bg-green-100 border-green-400 text-green-800 shadow-green-200';
    case 'orange':
      return 'bg-orange-100 border-orange-400 text-orange-800 shadow-orange-200';
    case 'red':
      return 'bg-red-100 border-red-400 text-red-800 shadow-red-200';
    default:
      return 'bg-white border-gray-300 text-gray-700';
  }
}