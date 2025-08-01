export interface PhonemeData {
  symbol: string;
  name: string;
  description: string;
  lipPosition: string;
  airflow: 'voiced' | 'unvoiced' | 'nasal';
}

export interface Exercise {
  id: string;
  type: 'phoneme' | 'word' | 'sentence' | 'conversation' | 'game' | 'breathing' | 'frequency-analysis';
  title: string;
  instruction: string;
  content: string | string[];
  targetPhonemes?: string[];
  difficulty: 1 | 2 | 3;
  points: number;
  requiredAccuracy: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  exercises: Exercise[];
  requiredScore: number;
  reward: string;
}

export interface Level {
  id: number;
  name: string;
  ageRange: string;
  description: string;
  goals: string[];
  phonemeFocus: string[];
  themes?: string[];
  exercises: Exercise[];
  dailyChallenges: DailyChallenge[];
  games: string[];
  requiredScoreToPass: number;
}

export interface StudentProgress {
  studentId: string;
  currentLevel: number;
  completedExercises: string[];
  scores: Record<string, number>;
  streakDays: number;
  totalXP: number;
  badges: string[];
  lastActiveDate: string;
}

export interface AssessmentQuestion {
  id: string;
  type: 'phoneme' | 'word' | 'sentence';
  prompt: string;
  expectedResponse: string;
  phonemes: string[];
  difficulty: number;
}