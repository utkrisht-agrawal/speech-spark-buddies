import { supabase } from '@/integrations/supabase/client';

export interface SpeechRecognitionResult {
  transcription: string;
  similarityScore: number;
  visemeScore: number;
  phonemeAnalysis?: any;
}

export class AdvancedSpeechRecognition {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  constructor() {
    console.log('Advanced Speech Recognition initialized with free Whisper backend');
  }

  async startRecording(): Promise<void> {
    try {
      console.log('Starting advanced recording...');
      
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('Audio chunk recorded:', event.data.size, 'bytes');
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      console.log('MediaRecorder started for backend processing');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording: ' + error.message);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing audio with backend AI...');
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        console.log('Audio blob created for backend:', audioBlob.size, 'bytes');
        
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  async recognizeSpeech(audioBlob: Blob, targetText?: string): Promise<SpeechRecognitionResult> {
    try {
      console.log('Converting audio for FREE Whisper backend processing...');
      
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      console.log('Sending audio to FREE speech recognition service (Hugging Face Whisper)...');
      
      const { data, error } = await supabase.functions.invoke('speech-recognition', {
        body: {
          audio: base64Audio,
          targetText: targetText
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Speech recognition failed: ' + error.message);
      }

      console.log('FREE Whisper speech recognition result:', data);
      
      return {
        transcription: data.transcription || '',
        similarityScore: data.similarityScore || 0,
        visemeScore: data.visemeScore || 0,
        phonemeAnalysis: data.phonemeAnalysis
      };
      
    } catch (error) {
      console.error('Error in FREE speech recognition:', error);
      return {
        transcription: '',
        similarityScore: 0,
        visemeScore: 0
      };
    }
  }

  async analyzePhonemes(audioBlob: Blob, targetPhonemes?: string[]): Promise<any> {
    try {
      console.log('Analyzing phonemes with FREE wav2vec backend...');
      
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const { data, error } = await supabase.functions.invoke('phoneme-analysis', {
        body: {
          audio: base64Audio,
          targetPhonemes: targetPhonemes
        }
      });

      if (error) {
        console.error('Phoneme analysis error:', error);
        throw new Error('Phoneme analysis failed: ' + error.message);
      }

      console.log('FREE wav2vec phoneme analysis result:', data);
      return data;
      
    } catch (error) {
      console.error('Error in FREE phoneme analysis:', error);
      return {
        phonemes: [],
        visemes: [],
        accuracy: 0
      };
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.audioChunks = [];
    console.log('Advanced speech recognition cleaned up');
  }
}

// Legacy compatibility functions
export async function initializeSpeechModels(): Promise<void> {
  console.log('Using backend speech models - no initialization needed');
}

export async function scoreSpeech(
  audioBlob: Blob, 
  target: string, 
  mode: 'phoneme' | 'word' | 'sentence' = 'phoneme'
): Promise<SpeechRecognitionResult> {
  console.log(`🎯 scoreSpeech called with mode: ${mode}, target: "${target}"`);
  
  const recognition = new AdvancedSpeechRecognition();
  const result = await recognition.recognizeSpeech(audioBlob, target);
  
  return {
    transcription: result.transcription,
    similarityScore: result.similarityScore,
    visemeScore: result.visemeScore,
    phonemeAnalysis: result.phonemeAnalysis
  };
}