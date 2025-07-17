import { Level, Exercise, DailyChallenge, AssessmentQuestion } from '@/types/curriculum';

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  { id: 'a1', type: 'phoneme', prompt: 'Say the sound "A"', expectedResponse: 'a', phonemes: ['a'], difficulty: 1 },
  { id: 'a2', type: 'phoneme', prompt: 'Say the sound "M"', expectedResponse: 'm', phonemes: ['m'], difficulty: 1 },
  { id: 'a3', type: 'word', prompt: 'Say "CAT"', expectedResponse: 'cat', phonemes: ['k', 'æ', 't'], difficulty: 2 },
  { id: 'a4', type: 'word', prompt: 'Say "APPLE"', expectedResponse: 'apple', phonemes: ['æ', 'p', 'əl'], difficulty: 3 },
  { id: 'a5', type: 'sentence', prompt: 'Say "I am happy"', expectedResponse: 'i am happy', phonemes: [], difficulty: 4 },
];

export const CURRICULUM_LEVELS: Level[] = [
  {
    id: 1,
    name: "Phoneme Awareness",
    ageRange: "4-5 years",
    description: "Recognize and articulate basic vowel and consonant sounds",
    goals: [
      "Recognize and articulate basic vowel and consonant sounds",
      "Understand how mouth and lips move to form phonemes",
      "Engage with daily sensory motor and visual-lip reading exercises"
    ],
    phonemeFocus: ['a', 'e', 'i', 'o', 'u', 'b', 'm', 'p', 't'],
    exercises: [
      {
        id: 'l1e1',
        type: 'phoneme',
        title: 'Vowel Sounds Practice',
        instruction: 'Watch the lip position and say each vowel sound',
        content: ['a', 'e', 'i', 'o', 'u'],
        targetPhonemes: ['a', 'e', 'i', 'o', 'u'],
        difficulty: 1,
        points: 10,
        requiredAccuracy: 70
      },
      {
        id: 'l1e2',
        type: 'breathing',
        title: 'Feather Blow Practice',
        instruction: 'Blow the feather while saying "P" sounds',
        content: 'Blow air control exercise with /p/ and /b/ sounds',
        targetPhonemes: ['p', 'b'],
        difficulty: 1,
        points: 15,
        requiredAccuracy: 80
      }
    ],
    dailyChallenges: [
      {
        id: 'l1c1',
        title: 'Sound Matching',
        description: 'Say target sound 5 times matching lip-shape',
        exercises: [],
        requiredScore: 350,
        reward: 'Sound Star Badge'
      }
    ],
    games: ['Pop the Sound Balloon', 'Feed the Monster'],
    requiredScoreToPass: 80
  },
  {
    id: 2,
    name: "Advanced Phonemes",
    ageRange: "5-6 years",
    description: "Improve accuracy in tongue placement and sound control",
    goals: [
      "Improve accuracy in tongue placement and sound control",
      "Learn nasal sounds and airflow differentiation"
    ],
    phonemeFocus: ['f', 'v', 's', 'z', 'm', 'n', 'k', 'd', 'g'],
    exercises: [
      {
        id: 'l2e1',
        type: 'phoneme',
        title: 'Fricative Sounds',
        instruction: 'Practice airflow with F and V sounds',
        content: ['f', 'v', 's', 'z'],
        targetPhonemes: ['f', 'v', 's', 'z'],
        difficulty: 2,
        points: 15,
        requiredAccuracy: 75
      }
    ],
    dailyChallenges: [],
    games: ['Phoneme Race', 'Sniff Snail'],
    requiredScoreToPass: 85
  },
  {
    id: 3,
    name: "Simple Word Formation",
    ageRange: "6-7 years",
    description: "Form CVC words and match words to pictures",
    goals: [
      "Form CVC (consonant-vowel-consonant) words",
      "Speak and match words to pictures"
    ],
    phonemeFocus: [],
    themes: ['Fruits', 'Animals', 'Objects'],
    exercises: [
      {
        id: 'l3e1',
        type: 'word',
        title: 'Animal Words',
        instruction: 'Say each animal name clearly',
        content: ['cat', 'dog', 'fox', 'pig', 'hen'],
        difficulty: 2,
        points: 20,
        requiredAccuracy: 80
      }
    ],
    dailyChallenges: [],
    games: ['Say It to Build It', 'Word Puzzles'],
    requiredScoreToPass: 85
  },
  {
    id: 4,
    name: "Vocabulary Expansion",
    ageRange: "7-8 years",
    description: "Broaden vocabulary with categorization and descriptive words",
    goals: [
      "Broaden vocabulary with categorization",
      "Use descriptive words and attributes"
    ],
    phonemeFocus: [],
    themes: ['Colors', 'Shapes', 'Body Parts', 'Verbs'],
    exercises: [
      {
        id: 'l4e1',
        type: 'word',
        title: 'Colors and Shapes',
        instruction: 'Say color and shape combinations',
        content: ['red circle', 'blue square', 'yellow triangle'],
        difficulty: 2,
        points: 25,
        requiredAccuracy: 80
      }
    ],
    dailyChallenges: [],
    games: ['Guess the Object', 'Color It Right'],
    requiredScoreToPass: 85
  },
  {
    id: 5,
    name: "Sentence Basics",
    ageRange: "8-9 years",
    description: "Form Subject + Verb + Object sentences with proper rhythm",
    goals: [
      "Form Subject + Verb + Object sentences",
      "Understand sentence rhythm and pauses"
    ],
    phonemeFocus: [],
    exercises: [
      {
        id: 'l5e1',
        type: 'sentence',
        title: 'Simple Sentences',
        instruction: 'Say complete sentences with proper pauses',
        content: ['I eat apple', 'She jumps high', 'We like mango'],
        difficulty: 3,
        points: 30,
        requiredAccuracy: 85
      }
    ],
    dailyChallenges: [],
    games: ['Build the Sentence', 'Bubble Speech'],
    requiredScoreToPass: 88
  },
  {
    id: 6,
    name: "Compound Sentences",
    ageRange: "9-10 years",
    description: "Use connectors and expand ideas with multiple clauses",
    goals: [
      'Use "and", "but", "because"',
      "Expand on ideas with multiple clauses"
    ],
    phonemeFocus: [],
    exercises: [
      {
        id: 'l6e1',
        type: 'sentence',
        title: 'Connected Sentences',
        instruction: 'Say sentences with connectors',
        content: ['I like apples and bananas', 'He is happy because he won'],
        difficulty: 3,
        points: 35,
        requiredAccuracy: 85
      }
    ],
    dailyChallenges: [],
    games: ['Connect the Sentence', 'Emotion Match'],
    requiredScoreToPass: 90
  },
  {
    id: 7,
    name: "Situational Conversations",
    ageRange: "10-11 years",
    description: "Practice real-life dialog and question-answer patterns",
    goals: [
      "Practice real-life dialog",
      "Recognize question-answer patterns"
    ],
    phonemeFocus: [],
    themes: ['At the market', 'At school', 'At the park', 'Visiting the doctor'],
    exercises: [
      {
        id: 'l7e1',
        type: 'conversation',
        title: 'Market Conversation',
        instruction: 'Practice buying something at the market',
        content: ['Hello, how much for apples?', 'I would like two apples please', 'Thank you very much'],
        difficulty: 3,
        points: 40,
        requiredAccuracy: 88
      }
    ],
    dailyChallenges: [],
    games: ['Role Play Room', 'Choose Your Dialog'],
    requiredScoreToPass: 90
  },
  {
    id: 8,
    name: "Creative Language & Expression",
    ageRange: "11-12 years",
    description: "Tell stories, describe pictures, and develop expressive speech",
    goals: [
      "Tell stories, describe pictures",
      "Develop expressive, original speech"
    ],
    phonemeFocus: [],
    exercises: [
      {
        id: 'l8e1',
        type: 'conversation',
        title: 'Picture Description',
        instruction: 'Describe what you see in the picture',
        content: 'Describe the scene with at least 3 sentences',
        difficulty: 3,
        points: 50,
        requiredAccuracy: 90
      }
    ],
    dailyChallenges: [],
    games: ['Story Spinner', 'Speak Your Comic Strip'],
    requiredScoreToPass: 92
  }
];