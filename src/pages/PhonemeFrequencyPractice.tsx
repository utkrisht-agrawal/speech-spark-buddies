import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import RecordButton from '@/components/RecordButton';
import { ArrowLeft, Play, Square, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AdvancedSpeechRecognition } from '@/utils/speechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const VOWELS = [
  { symbol: 'AA', name: 'THOUGHT', example: 'father' },
  { symbol: 'AE', name: 'TRAP', example: 'cat' },
  { symbol: 'AH', name: 'STRUT', example: 'cup' },
  { symbol: 'AO', name: 'THOUGHT', example: 'caught' },
  { symbol: 'AW', name: 'MOUTH', example: 'cow' },
  { symbol: 'AY', name: 'PRICE', example: 'my' },
  { symbol: 'EH', name: 'DRESS', example: 'bed' },
  { symbol: 'ER', name: 'NURSE', example: 'bird' },
  { symbol: 'EY', name: 'FACE', example: 'day' }
];

const CONSONANTS = [
  { symbol: 'B', name: 'VOICED STOP', example: 'boy' },
  { symbol: 'CH', name: 'VOICELESS AFFRICATE', example: 'chair' },
  { symbol: 'D', name: 'VOICED STOP', example: 'dog' },
  { symbol: 'DH', name: 'VOICED FRICATIVE', example: 'that' },
  { symbol: 'NG', name: 'VOICED NASAL', example: 'sing' }
];

const PhonemeFrequencyPractice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { speak, isSpeaking } = useTextToSpeech();
  
  const [selectedPhoneme, setSelectedPhoneme] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [frequencyMatch, setFrequencyMatch] = useState<number>(0);
  const [realTimeFrequency, setRealTimeFrequency] = useState<number[]>([]);
  const [targetFrequency, setTargetFrequency] = useState<number[]>([]);
  
  const speechRecognition = useRef<AdvancedSpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    speechRecognition.current = new AdvancedSpeechRecognition();
    
    return () => {
      speechRecognition.current?.cleanup();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const generateTargetFrequency = (phoneme: string) => {
    // Generate sample target frequency based on phoneme characteristics
    const baseFreq = {
      'AA': 730, 'AE': 660, 'AH': 520, 'AO': 570, 'AW': 600,
      'AY': 580, 'EH': 530, 'ER': 490, 'EY': 550,
      'B': 150, 'CH': 2000, 'D': 180, 'DH': 300, 'NG': 250
    }[phoneme] || 500;
    
    return Array.from({ length: 50 }, (_, i) => 
      baseFreq + Math.sin(i * 0.2) * 50 + Math.random() * 20 - 10
    );
  };

  const startFrequencyAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 2048;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateFrequency = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Find dominant frequency
        let maxIndex = 0;
        let maxValue = 0;
        for (let i = 0; i < bufferLength; i++) {
          if (dataArray[i] > maxValue) {
            maxValue = dataArray[i];
            maxIndex = i;
          }
        }
        
        const frequency = (maxIndex * audioContextRef.current!.sampleRate) / (2 * bufferLength);
        
        setRealTimeFrequency(prev => [...prev.slice(-49), frequency]);
        
        // Calculate match percentage
        if (targetFrequency.length > 0 && realTimeFrequency.length > 0) {
          const avgTarget = targetFrequency.reduce((a, b) => a + b, 0) / targetFrequency.length;
          const avgReal = realTimeFrequency.reduce((a, b) => a + b, 0) / realTimeFrequency.length;
          const match = Math.max(0, 100 - Math.abs(avgTarget - avgReal) / avgTarget * 100);
          setFrequencyMatch(match);
        }
        
        animationFrameRef.current = requestAnimationFrame(updateFrequency);
      };
      
      updateFrequency();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone for frequency analysis.",
        variant: "destructive",
      });
    }
  };

  const stopFrequencyAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const handlePhonemeSelect = (phoneme: string) => {
    setSelectedPhoneme(phoneme);
    setTargetFrequency(generateTargetFrequency(phoneme));
    setRealTimeFrequency([]);
    setFrequencyMatch(0);
  };

  const handleStartPractice = async () => {
    if (!selectedPhoneme) return;
    
    setIsRecording(true);
    await startFrequencyAnalysis();
  };

  const handleStopPractice = () => {
    setIsRecording(false);
    stopFrequencyAnalysis();
  };

  const playPhonemeSound = (phoneme: string) => {
    const phonemeExamples = {
      'AA': 'ahhh',
      'AE': 'aaa as in cat',
      'AH': 'uh as in cup',
      'AO': 'aw as in caught',
      'AW': 'ow as in cow',
      'AY': 'eye',
      'EH': 'eh as in bed',
      'ER': 'er as in bird',
      'EY': 'ay as in day',
      'B': 'buh',
      'CH': 'ch as in chair',
      'D': 'duh',
      'DH': 'th as in that',
      'NG': 'ng as in sing'
    };
    
    speak(phonemeExamples[phoneme as keyof typeof phonemeExamples] || phoneme);
  };

  const renderWaveform = (data: number[], color: string, label: string) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="h-20 border rounded-lg p-2 bg-card">
        <svg width="100%" height="100%" viewBox="0 0 400 60">
          {data.map((value, index) => (
            <rect
              key={index}
              x={index * 8}
              y={60 - (value / 10)}
              width="6"
              height={value / 10}
              fill={color}
              opacity={0.7}
            />
          ))}
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Phoneme Frequency Practice</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Phoneme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Select Phoneme to Practice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Vowels */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Vowels</h3>
                <div className="grid grid-cols-3 gap-2">
                  {VOWELS.map((vowel) => (
                    <Button
                      key={vowel.symbol}
                      variant={selectedPhoneme === vowel.symbol ? "default" : "outline"}
                      className="p-3 text-sm"
                      onClick={() => handlePhonemeSelect(vowel.symbol)}
                    >
                      <div className="text-center">
                        <div className="font-bold">{vowel.symbol}</div>
                        <div className="text-xs opacity-70">{vowel.example}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Consonants */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Consonants</h3>
                <div className="grid grid-cols-3 gap-2">
                  {CONSONANTS.map((consonant) => (
                    <Button
                      key={consonant.symbol}
                      variant={selectedPhoneme === consonant.symbol ? "default" : "outline"}
                      className="p-3 text-sm"
                      onClick={() => handlePhonemeSelect(consonant.symbol)}
                    >
                      <div className="text-center">
                        <div className="font-bold">{consonant.symbol}</div>
                        <div className="text-xs opacity-70">{consonant.example}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedPhoneme && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => playPhonemeSound(selectedPhoneme)}
                    disabled={isSpeaking}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play Example Sound
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Practice Area */}
          <Card>
            <CardHeader>
              <CardTitle>Frequency Matching Practice</CardTitle>
              {selectedPhoneme && (
                <Badge variant="secondary" className="w-fit">
                  Practicing: {selectedPhoneme}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedPhoneme ? (
                <>
                  {/* Match Score */}
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Frequency Match</div>
                    <div className="text-3xl font-bold text-primary">
                      {Math.round(frequencyMatch)}%
                    </div>
                  </div>

                  {/* Waveforms */}
                  <div className="space-y-4">
                    {renderWaveform(targetFrequency, "hsl(var(--primary))", "Target Frequency")}
                    {renderWaveform(realTimeFrequency, "hsl(var(--destructive))", "Your Voice")}
                  </div>

                  {/* Recording Controls */}
                  <div className="flex justify-center">
                    {!isRecording ? (
                      <Button
                        onClick={handleStartPractice}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Practice
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopPractice}
                        variant="destructive"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop Practice
                      </Button>
                    )}
                  </div>

                  {isRecording && (
                    <div className="text-center text-sm text-muted-foreground">
                      🎤 Make continuous "{selectedPhoneme}" sounds to match the target frequency
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a phoneme to start practicing
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PhonemeFrequencyPractice;