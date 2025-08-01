import React from 'react';
import VisemePractice from './VisemePractice';
import PhonemeFrequencyPractice from './PhonemeFrequencyPractice';
import { Exercise } from '@/types/curriculum';

interface ExerciseViewProps {
  exercise: Exercise;
  onComplete: (score: number) => void;
  onBack: () => void;
}

const ExerciseView: React.FC<ExerciseViewProps> = ({ exercise, onComplete, onBack }) => {
  if (exercise.type === 'frequency-analysis') {
    return (
      <PhonemeFrequencyPractice
        onBack={onBack}
        onComplete={onComplete}
      />
    );
  }

  const contentArray = Array.isArray(exercise.content)
    ? exercise.content
    : [exercise.content];

  return (
    <VisemePractice
      items={contentArray.map(item => item.toString())}
      title={exercise.title}
      onBack={onBack}
      onComplete={onComplete}
    />
  );
};

export default ExerciseView;
