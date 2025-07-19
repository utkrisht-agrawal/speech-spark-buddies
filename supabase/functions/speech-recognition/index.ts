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
    const { audio, targetText } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    console.log('Processing audio for speech recognition...');
    
    // Convert base64 audio to binary
    const binaryAudio = Uint8Array.from(atob(audio), c => c.charCodeAt(0));
    
    // Use Hugging Face Inference API with free Whisper model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/openai/whisper-small",
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
    console.log('Whisper transcription result:', result);
    
    let transcribedText = '';
    if (result.text) {
      transcribedText = result.text;
    } else if (Array.isArray(result) && result[0]?.text) {
      transcribedText = result[0].text;
    }

    // Calculate similarity score if target text provided
    let similarityScore = 0;
    if (targetText && transcribedText) {
      similarityScore = calculateSimilarity(
        transcribedText.toLowerCase().trim(),
        targetText.toLowerCase().trim()
      );
    }

    // Analyze phonemes for viseme matching
    const phonemeAnalysis = analyzePhonemes(transcribedText, targetText);

    return new Response(
      JSON.stringify({
        transcription: transcribedText,
        targetText: targetText || '',
        similarityScore: Math.round(similarityScore * 100),
        phonemeAnalysis,
        visemeScore: phonemeAnalysis.visemeAccuracy
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Speech recognition error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        transcription: '',
        similarityScore: 0,
        visemeScore: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function calculateSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  // Simple Levenshtein distance-based similarity
  const matrix = Array(text2.length + 1).fill(null).map(() => 
    Array(text1.length + 1).fill(null)
  );
  
  for (let i = 0; i <= text1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= text2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= text2.length; j++) {
    for (let i = 1; i <= text1.length; i++) {
      const indicator = text1[i - 1] === text2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLen = Math.max(text1.length, text2.length);
  return maxLen === 0 ? 1 : (maxLen - matrix[text2.length][text1.length]) / maxLen;
}

function analyzePhonemes(actual: string, target: string) {
  if (!actual || !target) {
    return {
      phonemeMatches: [],
      visemeAccuracy: 0,
      detectedVisemes: [],
      targetVisemes: []
    };
  }

  // Simple phoneme to viseme mapping
  const phonemeToViseme: { [key: string]: string } = {
    // Vowels
    'a': 'A', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
    'ah': 'A', 'eh': 'E', 'ih': 'I', 'oh': 'O', 'uh': 'U',
    
    // Consonants
    'm': 'M', 'p': 'M', 'b': 'M',
    'f': 'F', 'v': 'F',
    'th': 'TH', 
    't': 'T', 'd': 'T', 'n': 'T', 'l': 'T',
    's': 'S', 'z': 'S',
    'r': 'R',
    'k': 'K', 'g': 'K',
    'w': 'W',
    'y': 'Y'
  };

  const getVisemesFromText = (text: string): string[] => {
    return text.toLowerCase().split('').map(char => 
      phonemeToViseme[char] || 'REST'
    );
  };

  const detectedVisemes = getVisemesFromText(actual);
  const targetVisemes = getVisemesFromText(target);
  
  // Calculate viseme accuracy
  let matches = 0;
  const minLength = Math.min(detectedVisemes.length, targetVisemes.length);
  
  for (let i = 0; i < minLength; i++) {
    if (detectedVisemes[i] === targetVisemes[i]) {
      matches++;
    }
  }
  
  const visemeAccuracy = minLength > 0 ? Math.round((matches / minLength) * 100) : 0;

  return {
    phonemeMatches: detectedVisemes.map((viseme, i) => ({
      detected: viseme,
      target: targetVisemes[i] || 'REST',
      match: viseme === (targetVisemes[i] || 'REST')
    })),
    visemeAccuracy,
    detectedVisemes,
    targetVisemes
  };
}