import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, targetPhonemes } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio for phoneme analysis...');
    
    // Convert base64 audio to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Use Hugging Face wav2vec2 model for phoneme recognition
    const response = await fetch(
      "https://api-inference.huggingface.co/models/facebook/wav2vec2-base-960h",
      {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: binaryAudio,
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('wav2vec2 result:', result);
    
    let detectedText = '';
    if (result.text) {
      detectedText = result.text;
    } else if (Array.isArray(result) && result[0]?.text) {
      detectedText = result[0].text;
    }

    // Extract phonemes from the detected text
    const phonemeAnalysis = extractPhonemes(detectedText);
    
    // Map phonemes to visemes
    const visemeMapping = mapPhonemesToVisemes(phonemeAnalysis.phonemes);
    
    // Calculate accuracy if target provided
    let accuracy = 0;
    if (targetPhonemes) {
      accuracy = calculatePhonemeAccuracy(phonemeAnalysis.phonemes, targetPhonemes);
    }

    return new Response(
      JSON.stringify({
        detectedText,
        phonemes: phonemeAnalysis.phonemes,
        visemes: visemeMapping.visemes,
        accuracy: Math.round(accuracy * 100),
        timing: phonemeAnalysis.timing,
        confidence: phonemeAnalysis.confidence
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Phoneme analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        phonemes: [],
        visemes: [],
        accuracy: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractPhonemes(text: string) {
  if (!text) {
    return {
      phonemes: [],
      timing: [],
      confidence: []
    };
  }

  // Simple phoneme extraction from text
  // In a real implementation, you'd use a proper phoneme dictionary
  const words = text.toLowerCase().split(' ');
  const phonemes: string[] = [];
  const timing: number[] = [];
  const confidence: number[] = [];
  
  let currentTime = 0;
  
  words.forEach(word => {
    const wordPhonemes = textToPhonemes(word);
    wordPhonemes.forEach(phoneme => {
      phonemes.push(phoneme);
      timing.push(currentTime);
      confidence.push(0.8 + Math.random() * 0.2); // Simulated confidence
      currentTime += 0.1; // Simulate timing
    });
    currentTime += 0.2; // Pause between words
  });

  return {
    phonemes,
    timing,
    confidence
  };
}

function textToPhonemes(word: string): string[] {
  // Simplified text-to-phoneme mapping
  const phonemeMap: { [key: string]: string[] } = {
    'hello': ['h', 'eh', 'l', 'ow'],
    'world': ['w', 'er', 'l', 'd'],
    'speech': ['s', 'p', 'iy', 'ch'],
    'recognition': ['r', 'eh', 'k', 'ah', 'g', 'n', 'ih', 'sh', 'ah', 'n'],
    'practice': ['p', 'r', 'ae', 'k', 't', 'ih', 's'],
    'voice': ['v', 'oy', 's'],
    'buddy': ['b', 'ah', 'd', 'iy']
  };

  if (phonemeMap[word]) {
    return phonemeMap[word];
  }

  // Fallback: split into characters (very simplified)
  return word.split('');
}

function mapPhonemesToVisemes(phonemes: string[]) {
  const phonemeToViseme: { [key: string]: string } = {
    // Vowels
    'a': 'A', 'ae': 'A', 'ah': 'A',
    'e': 'E', 'eh': 'E', 'er': 'E',
    'i': 'I', 'ih': 'I', 'iy': 'I',
    'o': 'O', 'oh': 'O', 'ow': 'O', 'oy': 'O',
    'u': 'U', 'uh': 'U', 'uw': 'U',
    
    // Consonants
    'm': 'M', 'p': 'M', 'b': 'M',
    'f': 'F', 'v': 'F',
    'th': 'TH', 'dh': 'TH',
    't': 'T', 'd': 'T', 'n': 'T', 'l': 'T',
    's': 'S', 'z': 'S', 'sh': 'S', 'zh': 'S',
    'r': 'R',
    'k': 'K', 'g': 'K',
    'w': 'W',
    'y': 'Y',
    'h': 'REST',
    'ch': 'CH',
    'j': 'CH'
  };

  const visemes = phonemes.map(phoneme => 
    phonemeToViseme[phoneme.toLowerCase()] || 'REST'
  );

  const timing = phonemes.map((_, i) => i * 0.1);

  return {
    visemes,
    timing,
    mapping: phonemes.map((phoneme, i) => ({
      phoneme,
      viseme: visemes[i],
      time: timing[i]
    }))
  };
}

function calculatePhonemeAccuracy(detected: string[], target: string[]): number {
  if (!detected.length || !target.length) return 0;
  
  let matches = 0;
  const minLength = Math.min(detected.length, target.length);
  
  for (let i = 0; i < minLength; i++) {
    if (detected[i].toLowerCase() === target[i].toLowerCase()) {
      matches++;
    }
  }
  
  return matches / minLength;
}