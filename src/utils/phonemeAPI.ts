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
    console.log(`🔍 [PHONEME API] Starting request for: "${text}"`);
    
    const formData = new FormData();
    formData.append('text', text);
    console.log(`📋 [PHONEME API] FormData created for: "${text}"`);

    console.log(`📡 [PHONEME API] Making POST request to: http://localhost:8001/phonemeSequence`);
    const response = await fetch('http://localhost:8001/phonemeSequence', {
      method: 'POST',
      body: formData,
    });

    console.log(`📨 [PHONEME API] Response received - Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [PHONEME API] Error response:`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: PhonemeSequenceResponse = await response.json();
    console.log(`✅ [PHONEME API] Success for "${text}":`, data.phoneme_sequence);
    
    return data.phoneme_sequence;
  } catch (error) {
    console.error(`❌ [PHONEME API] Error for "${text}":`, error);
    // Fallback to simple character split if API fails
    console.warn(`⚠️ [PHONEME API] Using fallback for "${text}"`);
    return text.toLowerCase().split('');
  }
}

/**
 * Preloads phoneme sequences for multiple words/sentences
 * @param texts - Array of texts to preload
 * @returns Promise with map of text to phoneme sequences
 */
export async function preloadPhonemeSequences(texts: string[]): Promise<Record<string, string[]>> {
  console.log(`🚀 [PHONEME API] Starting preload for ${texts.length} texts:`, texts);
  const results: Record<string, string[]> = {};
  
  await Promise.all(
    texts.map(async (text) => {
      try {
        console.log(`🔄 [PHONEME API] Processing: "${text}"`);
        results[text] = await getPhonemeSequence(text);
        console.log(`✅ [PHONEME API] Completed: "${text}"`);
      } catch (error) {
        console.error(`❌ [PHONEME API] Failed to load phonemes for "${text}":`, error);
        results[text] = text.toLowerCase().split('');
      }
    })
  );
  
  console.log(`🎉 [PHONEME API] Preload complete. Results:`, results);
  return results;
}