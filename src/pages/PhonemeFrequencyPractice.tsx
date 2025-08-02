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

import referenceDictionaryData from '@/data/referenceDictionary';

interface PhonemeFrequencyPracticeProps {
  onBack?: () => void;
  onComplete?: (score: number) => void;
}

const PHONEMES = [
  { symbol: 'AA', name: 'THOUGHT', example: 'father' },
  { symbol: 'AE', name: 'TRAP', example: 'cat' },
  { symbol: 'AH', name: 'STRUT', example: 'cup' },
  { symbol: 'AO', name: 'THOUGHT', example: 'caught' },
  { symbol: 'AW', name: 'MOUTH', example: 'cow' },
  { symbol: 'AY', name: 'PRICE', example: 'my' },
  { symbol: 'EH', name: 'DRESS', example: 'bed' },
  { symbol: 'ER', name: 'NURSE', example: 'bird' },
  { symbol: 'EY', name: 'FACE', example: 'day' },
  { symbol: 'IH', name: 'KIT', example: 'bit' },
  { symbol: 'IY', name: 'FLEECE', example: 'beat' },
  { symbol: 'OW', name: 'GOAT', example: 'boat' },
  { symbol: 'OY', name: 'CHOICE', example: 'boy' },
  { symbol: 'UH', name: 'FOOT', example: 'book' },
  { symbol: 'UW', name: 'GOOSE', example: 'boot' },
  { symbol: 'B', name: 'VOICED STOP', example: 'boy' },
  { symbol: 'CH', name: 'VOICELESS AFFRICATE', example: 'chair' },
  { symbol: 'D', name: 'VOICED STOP', example: 'dog' },
  { symbol: 'DH', name: 'VOICED FRICATIVE', example: 'that' },
  { symbol: 'F', name: 'VOICELESS FRICATIVE', example: 'fish' },
  { symbol: 'G', name: 'VOICED STOP', example: 'go' },
  { symbol: 'HH', name: 'VOICELESS FRICATIVE', example: 'hat' },
  { symbol: 'JH', name: 'VOICED AFFRICATE', example: 'just' },
  { symbol: 'K', name: 'VOICELESS STOP', example: 'cat' },
  { symbol: 'L', name: 'VOICED LATERAL', example: 'love' },
  { symbol: 'M', name: 'VOICED NASAL', example: 'man' },
  { symbol: 'N', name: 'VOICED NASAL', example: 'not' },
  { symbol: 'NG', name: 'VOICED NASAL', example: 'sing' },
  { symbol: 'P', name: 'VOICELESS STOP', example: 'pat' },
  { symbol: 'R', name: 'VOICED APPROXIMANT', example: 'run' },
  { symbol: 'S', name: 'VOICELESS FRICATIVE', example: 'sun' },
  { symbol: 'SH', name: 'VOICELESS FRICATIVE', example: 'shoe' },
  { symbol: 'T', name: 'VOICELESS STOP', example: 'top' },
  { symbol: 'TH', name: 'VOICELESS FRICATIVE', example: 'think' },
  { symbol: 'V', name: 'VOICED FRICATIVE', example: 'very' },
  { symbol: 'W', name: 'VOICED APPROXIMANT', example: 'wet' },
  { symbol: 'Y', name: 'VOICED APPROXIMANT', example: 'yes' },
  { symbol: 'Z', name: 'VOICED FRICATIVE', example: 'zoo' },
  { symbol: 'ZH', name: 'VOICED FRICATIVE', example: 'measure' }
];

const PhonemeFrequencyPractice: React.FC<PhonemeFrequencyPracticeProps> = ({ 
  onBack, 
  onComplete 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { speak, isSpeaking } = useTextToSpeech();
  
  const [selectedPhoneme, setSelectedPhoneme] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [frequencyMatch, setFrequencyMatch] = useState<number>(0);
  const [realTimeFrequency, setRealTimeFrequency] = useState<number[]>([]);
  const [targetFrequency, setTargetFrequency] = useState<number[]>([]);
  const [referenceSpectrum, setReferenceSpectrum] = useState<number[]>([]);
  const [maxDbValue, setMaxDbValue] = useState<number>(-100);
  
  const speechRecognition = useRef<AdvancedSpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetCanvasRef = useRef<HTMLCanvasElement>(null);
  const referenceDictionary = useRef<{ [key: string]: number[] }>(referenceDictionaryData);

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

  // Convert amplitude (0-255) to dB scale
  const amplitudeToDb = (amplitude: number): number => {
    if (amplitude === 0) return -100; // Avoid log(0)
    return 20 * Math.log10(amplitude / 255);
  };

  // Convert dB back to normalized value for canvas rendering (0-1)
  const dbToNormalized = (db: number): number => {
    const minDb = -60; // Minimum dB to display
    const maxDb = 0;   // Maximum dB (0 dB = full scale)
    return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)));
  };

  const drawWaveform = (
    canvas: HTMLCanvasElement,
    dataArray: Uint8Array,
    color: string,
    sampleRate: number
  ) => {
    if (!canvas || dataArray.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions explicitly
    canvas.width = 400;
    canvas.height = 120;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const nyquist = sampleRate / 2;
    const freqPerBin = nyquist / dataArray.length;
    const maxFreq = 1500;
    const maxIndex = Math.floor((maxFreq / nyquist) * dataArray.length);

    // Draw the full frequency curve
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    const barWidth = canvas.width / maxIndex;

    for (let i = 0; i < maxIndex; i++) {
      const x = i * barWidth;
      const normalizedValue = dataArray[i] / 255; // Normalize directly
      const y = canvas.height - (normalizedValue * canvas.height * 0.8);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    // Find the top 3 frequency peaks
    const peaks = [];
    for (let i = 1; i < maxIndex - 1; i++) {
      if (dataArray[i] > dataArray[i - 1] && dataArray[i] > dataArray[i + 1]) {
        peaks.push({ value: dataArray[i], index: i });
      }
    }
    peaks.sort((a, b) => b.value - a.value);
    const topPeaks = peaks.slice(0, 3).sort((a, b) => a.index - b.index);

    // Draw the smooth curve for the top 3 peaks
    const points: { x: number; y: number }[] = [];
    topPeaks.forEach((peak) => {
      const x = peak.index * barWidth;
      const normalizedValue = peak.value / 255; // Normalize directly
      const y = canvas.height - (normalizedValue * canvas.height * 0.8);
      points.push({ x, y });
    });

    ctx.beginPath();
    ctx.strokeStyle = '#ff0000'; // Red for the smooth curve
    ctx.lineWidth = 1.5;

    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    ctx.stroke();

    // Display frequency values of the top 3 peaks
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    topPeaks.forEach((peak) => {
      const x = peak.index * barWidth;
      const y = canvas.height - ((peak.value / 255) * canvas.height * 0.8) - 10;
      const frequency = Math.round(peak.index * freqPerBin);
      // ctx.fillText(`${frequency} Hz`, x, y);
    });
  };

  // Draw both target and live waveforms on the same canvas
  const drawCombinedWaveform = (
    canvas: HTMLCanvasElement,
    targetData: Uint8Array,
    liveData: Uint8Array,
    sampleRate: number
  ) => {
    if (!canvas || (targetData.length === 0 && liveData.length === 0)) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 120;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const nyquist = sampleRate / 2;
    const freqPerBin = nyquist / Math.max(targetData.length, liveData.length);
    const maxFreq = 1500;
    const maxIndex = Math.floor((maxFreq / nyquist) * Math.max(targetData.length, liveData.length));
    const barWidth = canvas.width / maxIndex;

    // Draw target (blue)
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.min(maxIndex, targetData.length); i++) {
      const x = i * barWidth;
      const normalizedValue = targetData[i] / 255;
      const y = canvas.height - (normalizedValue * canvas.height * 0.8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw the 3 peaks of target data (blue, thin line)
    const targetPeaks = [];
    for (let i = 1; i < Math.min(maxIndex, targetData.length) - 1; i++) {
      if (targetData[i] > targetData[i - 1] && targetData[i] > targetData[i + 1]) {
        targetPeaks.push({ value: targetData[i], index: i });
      }
    }
    targetPeaks.sort((a, b) => b.value - a.value);
    const topTargetPeaks = targetPeaks.slice(0, 3).sort((a, b) => a.index - b.index);

    const targetPoints: { x: number; y: number }[] = [];
    topTargetPeaks.forEach((peak) => {
      const x = peak.index * barWidth;
      const normalizedValue = peak.value / 255;
      const y = canvas.height - (normalizedValue * canvas.height * 0.8);
      targetPoints.push({ x, y });
    });

    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    if (targetPoints.length > 0) {
      ctx.moveTo(targetPoints[0].x, targetPoints[0].y);
      for (let i = 1; i < targetPoints.length; i++) {
        ctx.lineTo(targetPoints[i].x, targetPoints[i].y);
      }
    }
    ctx.stroke();

    // Draw live (green)
    ctx.beginPath();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.min(maxIndex, liveData.length); i++) {
      const x = i * barWidth;
      const normalizedValue = liveData[i] / 255;
      const y = canvas.height - (normalizedValue * canvas.height * 0.8);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw the 3 peaks of live data (red)
    const peaks = [];
    for (let i = 1; i < Math.min(maxIndex, liveData.length) - 1; i++) {
      if (liveData[i] > liveData[i - 1] && liveData[i] > liveData[i + 1]) {
        peaks.push({ value: liveData[i], index: i });
      }
    }
    peaks.sort((a, b) => b.value - a.value);
    const topPeaks = peaks.slice(0, 3).sort((a, b) => a.index - b.index);

    const points: { x: number; y: number }[] = [];
    topPeaks.forEach((peak) => {
      const x = peak.index * barWidth;
      const normalizedValue = peak.value / 255;
      const y = canvas.height - (normalizedValue * canvas.height * 0.8);
      points.push({ x, y });
    });

    ctx.beginPath();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 1.5;
    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
    }
    ctx.stroke();
  };

  // Draw both on the same canvas
  const drawCombinedSoundWaveform = (targetData: number[], liveData: number[]) => {
    if (!canvasRef.current) return;
    drawCombinedWaveform(
      canvasRef.current,
      new Uint8Array(targetData),
      new Uint8Array(liveData),
      audioContextRef.current?.sampleRate || 44100
    );
  };

  // Remove drawLiveSoundWaveform and drawReferenceSpectrum, and use drawCombinedSoundWaveform instead
  useEffect(() => {
    // Redraw when either changes
    drawCombinedSoundWaveform(
      selectedPhoneme && referenceDictionary.current[selectedPhoneme]
        ? referenceDictionary.current[selectedPhoneme]
        : Array(2048).fill(0),
      realTimeFrequency
    );
    // eslint-disable-next-line
  }, [selectedPhoneme, referenceDictionary.current, realTimeFrequency]);

  const startFrequencyAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      analyserRef.current.minDecibels = -90;
      analyserRef.current.maxDecibels = -10;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateFrequency = () => {
        if (!analyserRef.current || !canvasRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        setRealTimeFrequency([...dataArray]);

        // Draw both target and live on the same canvas
        drawCombinedSoundWaveform(
          selectedPhoneme && referenceDictionary.current[selectedPhoneme]
            ? referenceDictionary.current[selectedPhoneme]
            : Array(2048).fill(0),
          Array.from(dataArray)
        );

        animationFrameRef.current = window.setTimeout(updateFrequency, 200);
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
      clearTimeout(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const loadReferenceSpectrum = async (phoneme: string) => {
    try {
      const audioContext = new AudioContext();
      const response = await fetch(`/sounds/AO.m4a`);
      // const response = await fetch(`/sounds/${phoneme}_trimmed.ogg`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;

      const analyser = offlineContext.createAnalyser();
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);
      analyser.connect(offlineContext.destination);
      source.start();

      await offlineContext.startRendering();
      analyser.getByteFrequencyData(dataArray);

      // Limit spectrum to 20Hz - 15000Hz
      const nyquist = audioBuffer.sampleRate / 2;
      const minFreq = 20;
      const maxFreq = 15000;
      const minIndex = Math.floor((minFreq / nyquist) * bufferLength);
      const maxIndex = Math.ceil((maxFreq / nyquist) * bufferLength);

      const spectrum = Array.from(dataArray.slice(minIndex, maxIndex));
      setReferenceSpectrum(spectrum);
    } catch (error) {
      console.error('Error loading reference spectrum:', error);
      toast({
        title: "Error",
        description: "Unable to load reference spectrum for the selected phoneme.",
        variant: "destructive",
      });
    }
  };

  const handlePhonemeSelect = (phoneme: string) => {
    setSelectedPhoneme(phoneme);
    // setTargetFrequency(generateTargetFrequency(phoneme));
    setRealTimeFrequency([]);
    setFrequencyMatch(0);
    loadReferenceSpectrum(phoneme); // Load reference spectrum
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
      'AH0': 'uh as in about',
      'AH': 'uh as in cup',
      'AO': 'aw as in caught',
      'AW': 'ow as in cow',
      'AY': 'eye',
      'EH': 'eh as in bed',
      'ER': 'er as in bird',
      'EY': 'ay as in day',
      'IH': 'ih as in bit',
      'IY': 'ee as in beat',
      'OW': 'oh as in boat',
      'OY': 'oy as in boy',
      'UH': 'uh as in book',
      'UW': 'oo as in boot',
      'B': 'buh',
      'CH': 'ch as in chair',
      'D': 'duh',
      'DH': 'th as in that',
      'F': 'fuh',
      'G': 'guh',
      'HH': 'huh',
      'JH': 'juh',
      'K': 'kuh',
      'L': 'luh',
      'M': 'muh',
      'N': 'nuh',
      'NG': 'ng as in sing',
      'P': 'puh',
      'R': 'ruh',
      'S': 'sss',
      'SH': 'shh',
      'T': 'tuh',
      'TH': 'th as in think',
      'V': 'vuh',
      'W': 'wuh',
      'Y': 'yuh',
      'Z': 'zzz',
      'ZH': 'zh as in measure'
    };
    
    speak(phonemeExamples[phoneme as keyof typeof phonemeExamples] || phoneme);
  };

  const setLiveAsReference = () => {
    if (realTimeFrequency.length > 0 && selectedPhoneme) {
      // Update the reference dictionary
      referenceDictionary.current[selectedPhoneme] = [...realTimeFrequency];
      
      // Also update the referenceSpectrum state to trigger re-render
      setReferenceSpectrum([...realTimeFrequency]);
      
      toast({
        title: "Reference Set and Saved",
        description: `Live sound has been set and saved as the reference for phoneme: ${selectedPhoneme}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description: "No live sound data available or phoneme selected.",
        variant: "destructive",
      });
    }
  };

  const saveReferenceToDictionary = () => {
    if (selectedPhoneme && referenceSpectrum.length > 0) {
      referenceDictionary.current[selectedPhoneme] = [...referenceSpectrum];
      
      toast({
        title: "Reference Saved",
        description: `Reference spectrum saved for phoneme: ${selectedPhoneme}`,
        variant: "default",
      });
    } else {
      toast({
        title: "Error",
        description: "No reference spectrum or phoneme selected.",
        variant: "destructive",
      });
    }
  };

  const dumpDictionaryToJson = () => {
    console.log(JSON.stringify(referenceDictionary.current, null, 2));
    toast({
      title: "Dictionary Dumped",
      description: "Reference dictionary has been printed in the console.",
      variant: "default",
    });
  };

  // Utility to compute average absolute difference between target and live data
  const getAverageAbsDifference = (target: number[], live: number[]) => {
    if (!target || !live || target.length === 0 || live.length === 0) return 0;
    const len = Math.min(target.length, live.length);
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += Math.abs(target[i] - live[i]);
    }
    let ret = ((100-(sum / len))-68)*7;
    // if (ret < 50) ret = ret/2 ; // Ensure it's not negative
    // Normalize to a score between 0 and 100
    // Adjust the scale based on the expected range of differences
    // For example, if the average difference is around 15, we can scale it to  
    // a score between 0 and 100
    ret = Math.min(92.6, ret);
    ret = Math.max(0, ret); // Ensure it's not negative
    
    return ret;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack || (() => navigate(-1))}
            className="p-2 hover:bg-white/50 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-purple-600" />
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-purple-800 mb-2">
              🎵 Sound Frequency Fun! 🎵
            </h1>
            <p className="text-lg text-purple-600">
              Match the sound waves to learn phonemes! 🌊
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Phoneme Selection */}
          <Card className="bg-gradient-to-br from-blue-100 to-cyan-100 border-4 border-blue-300 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-200 to-cyan-200 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Volume2 className="h-6 w-6" />
                🎯 Choose Your Sound!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {/* Phonemes */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-blue-800 flex items-center gap-2">
                  📚 Sound Library
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {PHONEMES.map((phoneme) => (
                    <Button
                      key={phoneme.symbol}
                      variant={selectedPhoneme === phoneme.symbol ? "default" : "outline"}
                      className={`p-4 text-sm border-2 transition-all duration-300 transform hover:scale-105 ${
                        selectedPhoneme === phoneme.symbol 
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-400 shadow-lg" 
                          : "bg-white hover:bg-purple-50 border-purple-300 text-purple-700 hover:border-purple-400"
                      }`}
                      onClick={() => handlePhonemeSelect(phoneme.symbol)}
                    >
                      <div className="text-center">
                        <div className="font-bold text-lg">{phoneme.symbol}</div>
                        <div className="text-xs opacity-80">{phoneme.example}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedPhoneme && (
                <div className="pt-4 border-t-2 border-blue-300">
                  <Button
                    variant="outline"
                    onClick={() => playPhonemeSound(selectedPhoneme)}
                    disabled={isSpeaking}
                    className="w-full bg-gradient-to-r from-green-400 to-blue-400 text-white border-0 hover:from-green-500 hover:to-blue-500 transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    🔊 Hear the Sound!
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Practice Area */}
          <Card className="bg-gradient-to-br from-pink-100 to-purple-100 border-4 border-pink-300 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-pink-200 to-purple-200 rounded-t-lg">
              <CardTitle className="text-pink-800">🎪 Practice Arena</CardTitle>
              {selectedPhoneme && (
                <Badge variant="secondary" className="w-fit bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 text-lg px-3 py-1">
                  🎯 Practicing: {selectedPhoneme}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {selectedPhoneme ? (
                <>
                  {/* Match Score */}
                  <div className="text-center p-6 border-4 border-dashed border-yellow-400 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50">
                    <div className="text-lg font-bold text-yellow-700 mb-2">
                      🏆 Your Score! 🏆
                    </div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {getAverageAbsDifference(
                        selectedPhoneme && referenceDictionary.current[selectedPhoneme]
                          ? referenceDictionary.current[selectedPhoneme]
                          : [],
                        realTimeFrequency
                      ).toFixed(1)}%
                    </div>
                    <div className="text-sm text-yellow-600 mt-2 font-semibold">
                      🌟 How well you match the sound waves! 🌟
                    </div>
                  </div>

                  {/* Waveforms */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="text-lg font-bold text-purple-700 text-center">
                        🌊 Magic Sound Waves 🌊
                      </div>
                      <div className="text-sm text-center text-purple-600 mb-2">
                        🔵 Target Wave | 🟢 Your Wave | 🔴 Peak Lines
                      </div>
                      <div className="border-4 border-purple-300 rounded-xl overflow-hidden bg-white shadow-inner">
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={120}
                          className="w-full bg-gradient-to-r from-blue-50 to-purple-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recording Controls */}
                  <div className="flex justify-center gap-4">
                    {!isRecording ? (
                      <Button
                        onClick={handleStartPractice}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 px-8 py-4 text-lg transform hover:scale-110 transition-all duration-300 shadow-xl"
                      >
                        <Play className="h-6 w-6 mr-2" />
                        🎤 Start the Fun!
                      </Button>
                    ) : (
                      <Button
                        onClick={handleStopPractice}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white border-0 px-8 py-4 text-lg transform hover:scale-110 transition-all duration-300 shadow-xl"
                      >
                        <Square className="h-6 w-6 mr-2" />
                        🛑 Stop Recording
                      </Button>
                    )}
                  </div>

                  {isRecording && (
                    <div className="text-center p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl border-2 border-green-300">
                      <div className="text-lg font-bold text-green-700 animate-pulse">
                        🎤 Make the "{selectedPhoneme}" sound! 🎵
                      </div>
                      <div className="text-sm text-green-600 mt-2">
                        Watch your green wave match the blue target wave! 🌊
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎵</div>
                  <div className="text-xl font-bold text-purple-600">
                    Pick a sound to start the fun! 
                  </div>
                  <div className="text-lg text-purple-500 mt-2">
                    Choose from the colorful buttons on the left! 👈
                  </div>
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