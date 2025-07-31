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
  console.log(`🔄 Attempting to fetch phonemes for: "${text}"`);
  
  try {
    const formData = new FormData();
    formData.append('text', text);

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.warn(`⏰ Timeout fetching phonemes for "${text}"`);
    }, 5000); // 5 second timeout

    const response = await fetch('http://localhost:8000/phonemeSequence', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: PhonemeSequenceResponse = await response.json();
    console.log(`✅ Phoneme sequence for "${text}":`, data.phoneme_sequence);
    
    return data.phoneme_sequence;
  } catch (error) {
    console.error(`❌ Error fetching phoneme sequence for "${text}":`, error);
    
    // More descriptive error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn(`⏰ Request timeout for "${text}" - using fallback`);
      } else if (error.message.includes('Failed to fetch')) {
        console.warn(`🌐 Network error for "${text}" - is localhost:8000 running? Using fallback`);
      } else {
        console.warn(`🔧 API error for "${text}": ${error.message} - using fallback`);
      }
    }
    
    // Fallback to simple character split if API fails
    const fallback = text.toLowerCase().split('');
    console.warn(`⚠️ Falling back to character split for "${text}":`, fallback);
    return fallback;
  }
}

/**
 * Preloads phoneme sequences for multiple words/sentences
 * @param texts - Array of texts to preload
 * @returns Promise with map of text to phoneme sequences
 */
export async function preloadPhonemeSequences(texts: string[]): Promise<Record<string, string[]>> {
  console.log(`🚀 Starting to preload phonemes for ${texts.length} words:`, texts);
  const results: Record<string, string[]> = {};
  
  // Add overall timeout for the entire preload process
  const startTime = Date.now();
  
  await Promise.all(
    texts.map(async (text) => {
      try {
        results[text] = await getPhonemeSequence(text);
      } catch (error) {
        console.error(`❌ Failed to load phonemes for "${text}":`, error);
        results[text] = text.toLowerCase().split('');
      }
    })
  );
  
  const duration = Date.now() - startTime;
  console.log(`✅ Preloaded all phonemes in ${duration}ms:`, results);
  
  return results;
}