import { pipeline, AutoTokenizer } from "@huggingface/transformers";

// Types for our speech recognition results
export interface SpeechRecognitionResult {
  score: number;
  transcript: string;
  spokenPhonemes?: string;
  targetPhonemes?: string;
}

export interface SpeechProcessor {
  whisperModel: any;
  wav2vecModel: any;
  initialized: boolean;
}

// Global processor instance
let processor: SpeechProcessor = {
  whisperModel: null,
  wav2vecModel: null,
  initialized: false
};

// Initialize speech recognition models
export async function initializeSpeechModels(): Promise<void> {
  if (processor.initialized) return;

  try {
    console.log("🤖 Loading speech recognition models...");
    
    // Load Whisper for sentence recognition
    processor.whisperModel = await pipeline(
      "automatic-speech-recognition",
      "onnx-community/whisper-tiny.en",
      { device: "webgpu" }
    );

    // Load Wav2Vec2 for phoneme recognition
    processor.wav2vecModel = await pipeline(
      "automatic-speech-recognition", 
      "facebook/wav2vec2-large-960h-lv60-self",
      { device: "webgpu" }
    );

    processor.initialized = true;
    console.log("✅ Speech models loaded successfully");
  } catch (error) {
    console.error("❌ Failed to load speech models:", error);
    // Fallback to CPU if WebGPU fails
    try {
      processor.whisperModel = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny.en"
      );
      processor.wav2vecModel = await pipeline(
        "automatic-speech-recognition",
        "facebook/wav2vec2-large-960h-lv60-self"
      );
      processor.initialized = true;
      console.log("✅ Speech models loaded on CPU");
    } catch (fallbackError) {
      console.error("❌ Failed to load speech models on CPU:", fallbackError);
      throw fallbackError;
    }
  }
}

// Simple grapheme-to-phoneme conversion (basic approximation)
function textToPhonemes(text: string): string {
  // Basic phoneme mapping - in a real implementation you'd use a proper G2P library
  const phonemeMap: { [key: string]: string } = {
    'a': 'æ', 'e': 'ɛ', 'i': 'ɪ', 'o': 'ɔ', 'u': 'ʊ',
    'th': 'θ', 'sh': 'ʃ', 'ch': 'tʃ', 'ng': 'ŋ',
    'b': 'b', 'c': 'k', 'd': 'd', 'f': 'f', 'g': 'g',
    'h': 'h', 'j': 'dʒ', 'k': 'k', 'l': 'l', 'm': 'm',
    'n': 'n', 'p': 'p', 'q': 'k', 'r': 'r', 's': 's',
    't': 't', 'v': 'v', 'w': 'w', 'x': 'ks', 'y': 'j', 'z': 'z'
  };

  return text.toLowerCase()
    .split('')
    .map(char => phonemeMap[char] || char)
    .join(' ');
}

// Calculate similarity between two strings (like Python's SequenceMatcher)
function calculateSimilarity(target: string, spoken: string): number {
  const targetWords = target.toLowerCase().trim().split(/\s+/);
  const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
  
  // Levenshtein distance approximation
  const maxLength = Math.max(targetWords.length, spokenWords.length);
  if (maxLength === 0) return 100;
  
  let matches = 0;
  const minLength = Math.min(targetWords.length, spokenWords.length);
  
  for (let i = 0; i < minLength; i++) {
    if (targetWords[i] === spokenWords[i]) {
      matches++;
    }
  }
  
  return Math.round((matches / maxLength) * 100);
}

// Convert audio blob to array buffer for processing
async function audioToArrayBuffer(audioBlob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(audioBlob);
  });
}

// Transcribe with Whisper (for sentences)
async function transcribeWithWhisper(audioBlob: Blob, target: string): Promise<SpeechRecognitionResult> {
  if (!processor.whisperModel) {
    throw new Error("Whisper model not initialized");
  }

  try {
    console.log("🗣️ Processing with Whisper...");
    
    // Convert blob to URL for processing
    const audioUrl = URL.createObjectURL(audioBlob);
    const result = await processor.whisperModel(audioUrl);
    
    const transcript = result.text.toLowerCase().trim();
    console.log(`🗣️ Whisper Transcript: "${transcript}"`);
    
    const score = calculateSimilarity(target, transcript);
    
    URL.revokeObjectURL(audioUrl);
    
    return {
      score,
      transcript,
      spokenPhonemes: transcript,
      targetPhonemes: target
    };
  } catch (error) {
    console.error("❌ Whisper transcription failed:", error);
    return {
      score: 0,
      transcript: "Recognition failed",
      spokenPhonemes: "",
      targetPhonemes: target
    };
  }
}

// Transcribe with Wav2Vec2 (for phonemes)
async function transcribeWithWav2Vec(audioBlob: Blob, target: string): Promise<SpeechRecognitionResult> {
  if (!processor.wav2vecModel) {
    throw new Error("Wav2Vec2 model not initialized");
  }

  try {
    console.log("🗣️ Processing with Wav2Vec2...");
    
    // Convert blob to URL for processing
    const audioUrl = URL.createObjectURL(audioBlob);
    const result = await processor.wav2vecModel(audioUrl);
    
    const transcript = result.text.toLowerCase().trim();
    console.log(`🗣️ Wav2Vec2 Transcript: "${transcript}"`);
    
    // Convert to phonemes
    const spokenPhonemes = textToPhonemes(transcript);
    const targetPhonemes = textToPhonemes(target);
    
    console.log(`✅ Target Phonemes: "${targetPhonemes}"`);
    console.log(`🗣️ Spoken Phonemes: "${spokenPhonemes}"`);
    
    const score = calculateSimilarity(targetPhonemes, spokenPhonemes);
    
    URL.revokeObjectURL(audioUrl);
    
    return {
      score,
      transcript,
      spokenPhonemes,
      targetPhonemes
    };
  } catch (error) {
    console.error("❌ Wav2Vec2 transcription failed:", error);
    return {
      score: 0,
      transcript: "Recognition failed",
      spokenPhonemes: "",
      targetPhonemes: textToPhonemes(target)
    };
  }
}

// Main function to score speech against target
export async function scoreSpeech(
  audioBlob: Blob, 
  target: string, 
  mode: 'phoneme' | 'word' | 'sentence' = 'phoneme'
): Promise<SpeechRecognitionResult> {
  
  if (!processor.initialized) {
    console.log("🤖 Models not initialized, loading...");
    await initializeSpeechModels();
  }

  console.log(`\n🎯 Mode: ${mode}, Target: "${target}"`);

  try {
    let result: SpeechRecognitionResult;
    
    if (mode === 'sentence') {
      result = await transcribeWithWhisper(audioBlob, target);
    } else {
      // Use Wav2Vec2 for phoneme and word level recognition
      result = await transcribeWithWav2Vec(audioBlob, target);
    }
    
    console.log(`✅ Score: ${result.score}%`);
    return result;
    
  } catch (error) {
    console.error("❌ Speech recognition failed:", error);
    return {
      score: 0,
      transcript: "Processing failed",
      spokenPhonemes: "",
      targetPhonemes: mode === 'sentence' ? target : textToPhonemes(target)
    };
  }
}