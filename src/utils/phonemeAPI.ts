// Utility for calling the backend phoneme sequence API

export interface PhonemeSequenceResponse {
  input_text: string;
  phoneme_sequence: string[];
}

/**
 * Fetches phoneme sequence from backend API
 * @param text - The word or sentence to get phonemes for
 * @returns Promise with phoneme sequence data
 */
export async function getPhonemeSequence(text: string): Promise<string[]> {
  try {
    const formData = new FormData();
    formData.append('text', text);

    const response = await fetch('http://localhost:8000/phonemeSequence', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: PhonemeSequenceResponse = await response.json();
    console.log(`📝 Phoneme sequence for "${text}":`, data.phoneme_sequence);
    
    return data.phoneme_sequence;
  } catch (error) {
    console.error('Error fetching phoneme sequence:', error);
    // Fallback to simple character split if API fails
    console.warn(`⚠️ Falling back to character split for "${text}"`);
    return text.toLowerCase().split('');
  }
}

/**
 * Preloads phoneme sequences for multiple words/sentences
 * @param texts - Array of texts to preload
 * @returns Promise with map of text to phoneme sequences
 */
export async function preloadPhonemeSequences(texts: string[]): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {};
  
  await Promise.all(
    texts.map(async (text) => {
      try {
        results[text] = await getPhonemeSequence(text);
      } catch (error) {
        console.error(`Failed to load phonemes for "${text}":`, error);
        results[text] = text.toLowerCase().split('');
      }
    })
  );
  
  return results;
}