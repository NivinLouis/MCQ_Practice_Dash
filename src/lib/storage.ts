import { StoredQuiz, QuizProgress, QuizResult, Question } from './types';

const QUIZZES_KEY = 'ccw_quizzes';

function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

export function getStoredQuizzes(): StoredQuiz[] {
  return getFromStorage<StoredQuiz[]>(QUIZZES_KEY, []);
}

export function saveQuiz(quiz: StoredQuiz): void {
  const quizzes = getStoredQuizzes();
  quizzes.push(quiz);
  setToStorage(QUIZZES_KEY, quizzes);
}

export function deleteQuiz(id: string): void {
  const quizzes = getStoredQuizzes().filter(q => q.id !== id);
  setToStorage(QUIZZES_KEY, quizzes);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`ccw_progress_${id}`);
    localStorage.removeItem(`ccw_result_${id}`);
  }
}

export function getQuizById(id: string): StoredQuiz | undefined {
  return getStoredQuizzes().find(q => q.id === id);
}

export function getProgress(quizId: string): QuizProgress {
  return getFromStorage<QuizProgress>(`ccw_progress_${quizId}`, {
    currentIndex: 0,
    answers: {},
    completed: false,
  });
}

export function saveProgress(quizId: string, progress: QuizProgress): void {
  setToStorage(`ccw_progress_${quizId}`, progress);
}

export function getResult(quizId: string): QuizResult | undefined {
  return getFromStorage<QuizResult | undefined>(`ccw_result_${quizId}`, undefined);
}

export function saveResult(quizId: string, result: QuizResult): void {
  setToStorage(`ccw_result_${quizId}`, result);
}

export function computeResult(quizId: string): QuizResult | null {
  const quiz = getQuizById(quizId);
  if (!quiz) return null;

  const progress = getProgress(quizId);
  let score = 0;
  const total = quiz.questions.length;

  quiz.questions.forEach((q: Question) => {
    const userAnswer = progress.answers[String(q.id)];
    if (userAnswer !== undefined && userAnswer === q.correctAnswerIndex) {
      score++;
    }
  });

  const result: QuizResult = {
    quizId,
    score,
    total,
    answers: progress.answers,
    finishedAt: new Date().toISOString(),
  };

  saveResult(quizId, result);
  return result;
}

export function getQuizStats() {
  const quizzes = getStoredQuizzes();
  const results = quizzes
    .map(q => getResult(q.id))
    .filter((r): r is QuizResult => r !== undefined);

  const totalQuizzesTaken = results.length;
  const averageScore = results.length > 0
    ? results.reduce((sum, r) => sum + (r.score / r.total) * 100, 0) / results.length
    : 0;

  return { totalQuizzesTaken, averageScore, totalBanks: quizzes.length };
}
