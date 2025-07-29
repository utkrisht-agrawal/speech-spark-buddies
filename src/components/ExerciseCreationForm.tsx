import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Volume2 } from 'lucide-react';
import { toast } from 'sonner';

interface PhonemeItem {
  id: string;
  character: string;
  imageUrl?: string;
}

interface WordItem {
  id: string;
  word: string;
  phonemes: PhonemeItem[];
}

interface SentenceItem {
  id: string;
  sentence: string;
  words: WordItem[];
}

interface ExerciseData {
  type: 'phoneme' | 'word' | 'sentence';
  title: string;
  instruction: string;
  difficulty: 1 | 2 | 3;
  points: number;
  requiredAccuracy: number;
  content: any[];
}

interface ExerciseCreationFormProps {
  onSubmit: (exercise: ExerciseData) => void;
  onCancel: () => void;
}

const AVAILABLE_PHONEME_IMAGES = [
  { phoneme: 'AH', url: '/lovable-uploads/mouth-ah.png', name: 'AH - Open wide' },
  { phoneme: 'A', url: '/lovable-uploads/mouth-a.png', name: 'A - Medium open' },
  { phoneme: 'E', url: '/lovable-uploads/mouth-e.png', name: 'E - Spread lips' },
  { phoneme: 'EH', url: '/lovable-uploads/mouth-eh.png', name: 'EH - Relaxed' },
  { phoneme: 'I', url: '/lovable-uploads/mouth-i.png', name: 'I - Small opening' },
  { phoneme: 'M', url: '/lovable-uploads/mouth-m.png', name: 'M - Lips together' },
  { phoneme: 'O', url: '/lovable-uploads/mouth-o.png', name: 'O - Round lips' },
  { phoneme: 'REST', url: '/lovable-uploads/mouth-rest.png', name: 'Rest position' },
  { phoneme: 'TEETH', url: '/lovable-uploads/mouth-teeth.png', name: 'Show teeth' },
  { phoneme: 'WIDE', url: '/lovable-uploads/mouth-wide.png', name: 'Wide smile' },
];

const ExerciseCreationForm: React.FC<ExerciseCreationFormProps> = ({ onSubmit, onCancel }) => {
  const [exercise, setExercise] = useState<ExerciseData>({
    type: 'phoneme',
    title: '',
    instruction: '',
    difficulty: 1,
    points: 10,
    requiredAccuracy: 70,
    content: []
  });

  const [currentPhoneme, setCurrentPhoneme] = useState('');
  const [selectedPhonemeImage, setSelectedPhonemeImage] = useState('');
  const [currentWord, setCurrentWord] = useState('');
  const [currentSentence, setCurrentSentence] = useState('');

  const addPhoneme = () => {
    if (!currentPhoneme.trim()) {
      toast.error('Please enter a phoneme character');
      return;
    }

    const newPhoneme: PhonemeItem = {
      id: Math.random().toString(36).substring(7),
      character: currentPhoneme.toUpperCase(),
      imageUrl: selectedPhonemeImage || undefined
    };

    setExercise(prev => ({
      ...prev,
      content: [...prev.content, newPhoneme]
    }));

    setCurrentPhoneme('');
    setSelectedPhonemeImage('');
  };

  const addWord = () => {
    if (!currentWord.trim()) {
      toast.error('Please enter a word');
      return;
    }

    // Split word into phonemes (simplified - in real app, use phonetic dictionary)
    const phonemes = currentWord.toUpperCase().split('').map(char => ({
      id: Math.random().toString(36).substring(7),
      character: char,
      imageUrl: AVAILABLE_PHONEME_IMAGES.find(img => img.phoneme === char)?.url
    }));

    const newWord: WordItem = {
      id: Math.random().toString(36).substring(7),
      word: currentWord,
      phonemes
    };

    setExercise(prev => ({
      ...prev,
      content: [...prev.content, newWord]
    }));

    setCurrentWord('');
  };

  const addSentence = () => {
    if (!currentSentence.trim()) {
      toast.error('Please enter a sentence');
      return;
    }

    // Split sentence into words, then into phonemes
    const words = currentSentence.split(' ').map(word => {
      const phonemes = word.toUpperCase().split('').map(char => ({
        id: Math.random().toString(36).substring(7),
        character: char,
        imageUrl: AVAILABLE_PHONEME_IMAGES.find(img => img.phoneme === char)?.url
      }));

      return {
        id: Math.random().toString(36).substring(7),
        word,
        phonemes
      };
    });

    const newSentence: SentenceItem = {
      id: Math.random().toString(36).substring(7),
      sentence: currentSentence,
      words
    };

    setExercise(prev => ({
      ...prev,
      content: [...prev.content, newSentence]
    }));

    setCurrentSentence('');
  };

  const removeItem = (id: string) => {
    setExercise(prev => ({
      ...prev,
      content: prev.content.filter(item => item.id !== id)
    }));
  };

  const handleSubmit = () => {
    if (!exercise.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!exercise.instruction.trim()) {
      toast.error('Please enter instructions');
      return;
    }
    if (exercise.content.length === 0) {
      toast.error('Please add at least one item to the exercise');
      return;
    }

    onSubmit(exercise);
  };

  const speakPhoneme = (phoneme: string) => {
    const utterance = new SpeechSynthesisUtterance(phoneme);
    utterance.rate = 0.5;
    speechSynthesis.speak(utterance);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Exercise</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Exercise Type</Label>
            <Select 
              value={exercise.type} 
              onValueChange={(value: 'phoneme' | 'word' | 'sentence') => 
                setExercise({...exercise, type: value, content: []})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phoneme">Phonemes</SelectItem>
                <SelectItem value="word">Words</SelectItem>
                <SelectItem value="sentence">Sentences</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Difficulty</Label>
            <Select 
              value={exercise.difficulty.toString()} 
              onValueChange={(value) => setExercise({...exercise, difficulty: parseInt(value) as 1 | 2 | 3})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Easy</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Title</Label>
          <Input
            value={exercise.title}
            onChange={(e) => setExercise({...exercise, title: e.target.value})}
            placeholder="Exercise title"
          />
        </div>

        <div>
          <Label>Instructions</Label>
          <Textarea
            value={exercise.instruction}
            onChange={(e) => setExercise({...exercise, instruction: e.target.value})}
            placeholder="Instructions for the student"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Points</Label>
            <Input
              type="number"
              value={exercise.points}
              onChange={(e) => setExercise({...exercise, points: parseInt(e.target.value)})}
              min="1"
              max="100"
            />
          </div>
          <div>
            <Label>Required Accuracy (%)</Label>
            <Input
              type="number"
              value={exercise.requiredAccuracy}
              onChange={(e) => setExercise({...exercise, requiredAccuracy: parseInt(e.target.value)})}
              min="1"
              max="100"
            />
          </div>
        </div>

        {/* Content based on type */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Exercise Content</Label>
          
          {exercise.type === 'phoneme' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phoneme Character</Label>
                  <Input
                    value={currentPhoneme}
                    onChange={(e) => setCurrentPhoneme(e.target.value)}
                    placeholder="e.g., AH, B, TH"
                    maxLength={3}
                  />
                </div>
                <div>
                  <Label>Mouth Shape Image</Label>
                  <RadioGroup value={selectedPhonemeImage} onValueChange={setSelectedPhonemeImage}>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {AVAILABLE_PHONEME_IMAGES.map((img) => (
                        <div key={img.phoneme} className="flex items-center space-x-2">
                          <RadioGroupItem value={img.url} id={img.phoneme} />
                          <label htmlFor={img.phoneme} className="flex items-center space-x-2 cursor-pointer">
                            <img src={img.url} alt={img.name} className="w-8 h-8 rounded" />
                            <span className="text-sm">{img.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <Button onClick={addPhoneme} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Phoneme
              </Button>
            </div>
          )}

          {exercise.type === 'word' && (
            <div className="space-y-4">
              <div>
                <Label>Word</Label>
                <Input
                  value={currentWord}
                  onChange={(e) => setCurrentWord(e.target.value)}
                  placeholder="Enter a word (will be split into phonemes)"
                />
              </div>
              <Button onClick={addWord} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Word
              </Button>
            </div>
          )}

          {exercise.type === 'sentence' && (
            <div className="space-y-4">
              <div>
                <Label>Sentence</Label>
                <Textarea
                  value={currentSentence}
                  onChange={(e) => setCurrentSentence(e.target.value)}
                  placeholder="Enter a sentence (will be split into words and phonemes)"
                />
              </div>
              <Button onClick={addSentence} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Sentence
              </Button>
            </div>
          )}

          {/* Display added content */}
          <div className="space-y-2">
            <Label>Added Items ({exercise.content.length})</Label>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {exercise.type === 'phoneme' && exercise.content.map((phoneme: PhonemeItem) => (
                <div key={phoneme.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    {phoneme.imageUrl && (
                      <img src={phoneme.imageUrl} alt={phoneme.character} className="w-8 h-8 rounded" />
                    )}
                    <Badge variant="secondary">{phoneme.character}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakPhoneme(phoneme.character)}
                    >
                      <Volume2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeItem(phoneme.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {exercise.type === 'word' && exercise.content.map((word: WordItem) => (
                <div key={word.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{word.word}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(word.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {word.phonemes.map((phoneme) => (
                      <Badge key={phoneme.id} variant="outline" className="text-xs">
                        {phoneme.character}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}

              {exercise.type === 'sentence' && exercise.content.map((sentence: SentenceItem) => (
                <div key={sentence.id} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{sentence.sentence}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(sentence.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {sentence.words.map((word) => (
                      <div key={word.id} className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{word.word}:</span>
                        <div className="flex flex-wrap gap-1">
                          {word.phonemes.map((phoneme) => (
                            <Badge key={phoneme.id} variant="outline" className="text-xs">
                              {phoneme.character}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Exercise
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseCreationForm;