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
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices not supported');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Audio stream obtained:', this.stream.getAudioTracks().length, 'tracks');

      // Check MediaRecorder support and find compatible mime type
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
            console.warn('No supported mime type found, using default');
          }
        }
      }
      console.log('Using mime type:', mimeType || 'default');

      this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : {});
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('Audio chunk added. Total chunks:', this.audioChunks.length);
        }
      };

      this.mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      this.mediaRecorder.start(100); // Collect data every 100ms for better capture
      console.log('MediaRecorder start() called');
      
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

      console.log('Stopping recording, current state:', this.mediaRecorder.state);
      console.log('Audio chunks collected so far:', this.audioChunks.length);

      this.mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing audio...');
        console.log('Final audio chunks count:', this.audioChunks.length);
        
        if (this.audioChunks.length === 0) {
          console.warn('No audio chunks recorded!');
          // Create a minimal audio blob to prevent errors
          const silence = new Blob([new ArrayBuffer(1024)], { type: 'audio/webm' });
          resolve(silence);
          return;
        }

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        console.log('Audio blob created:', audioBlob.size, 'bytes', 'type:', audioBlob.type);
        
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => {
            console.log('Stopping track:', track.kind, track.readyState);
            track.stop();
          });
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