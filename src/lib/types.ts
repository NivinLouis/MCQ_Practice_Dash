export interface Question {
  id: string | number;
  questionText: string;
  options: [string, string, string, string];
  correctAnswerIndex: number | null;
  explanation?: string;
}

export interface QuizBank {
  quizTitle: string;
  questions: Question[];
}

export interface StoredQuiz {
  id: string;
  quizTitle: string;
  questions: Question[];
  uploadedAt: string;
}

export interface QuizProgress {
  currentIndex: number;
  answers: Record<string, number>;
  completed: boolean;
}

export interface QuizResult {
  quizId: string;
  score: number;
  total: number;
  answers: Record<string, number>;
  finishedAt: string;
}

export interface ValidationError {
  message: string;
  path: string;
}
