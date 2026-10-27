export interface Option {
  id: 'A' | 'B' | 'C' | 'D';
  es: string;
  arm: string;
}

export interface Question {
  id: number;
  part: 1 | 2;
  partTitleEs: string;
  partTitleArm: string;
  titleEs: string;
  titleArm: string;
  scenarioEs: string;
  scenarioArm: string;
  options: Option[];
  correctOptionId: 'A' | 'B' | 'C' | 'D';
  explanationEs: string;
  explanationArm: string;
  level: string;
  coachTipEs: string;
  coachTipArm: string;
}

export type LifelineType = 'fiftyFifty' | 'askCoach' | 'callFriend';

export interface LifelinesState {
  fiftyFifty: boolean;
  askCoach: boolean;
  callFriend: boolean;
}

export interface AnswerHistory {
  questionId: number;
  selectedOptionId: 'A' | 'B' | 'C' | 'D';
  correctOptionId: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  prizeAwarded: number;
}
