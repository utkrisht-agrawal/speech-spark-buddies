import { useState, useCallback } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = useCallback((text: string, options?: { rate?: number; pitch?: number; volume?: number }) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = options?.rate || 1;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || 1;

      const voices = window.speechSynthesis.getVoices();
      // Prefer an American English voice
      const americanVoice = voices.find(
        voice => voice.lang === 'en-US'
      );

      if (americanVoice) {
        utterance.voice = americanVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
};
