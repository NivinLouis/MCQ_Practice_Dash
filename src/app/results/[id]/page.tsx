'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Home, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuizById, getResult, saveProgress, computeResult } from '@/lib/storage';
import { StoredQuiz, QuizResult } from '@/lib/types';

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [quiz] = useState<StoredQuiz | null>(() => getQuizById(id) ?? null);
  const [result] = useState<QuizResult | null>(() => {
    const existing = getResult(id);
    if (existing) return existing;
    return computeResult(id);
  });

  useEffect(() => {
    if (!quiz) router.push('/');
  }, [quiz, router]);

  if (!quiz || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading results...</p>
      </div>
    );
  }

  const percentage = Math.round((result.score / result.total) * 100);

  const handleRetake = () => {
    saveProgress(id, { currentIndex: 0, answers: {}, completed: false });
    router.push(`/quiz/${id}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <h1 className="text-sm font-semibold truncate">{quiz.quizTitle}</h1>
          <span className="text-xs text-zinc-400">Results</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <Card className="mb-8 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <span className="text-6xl font-bold">{percentage}%</span>
            </div>
            <p className="mb-2 text-lg">
              {result.score} / {result.total} correct
            </p>
            <p className="text-sm text-zinc-500">
              {percentage >= 80
                ? 'Great job!'
                : percentage >= 50
                ? 'Good effort! Keep practicing.'
                : 'Keep studying and try again!'}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={() => router.push('/')} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Button>
              <Button onClick={handleRetake} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {quiz.questions.map((q, i) => {
                const userAnswer = result.answers[String(q.id)];
                const hasAnswer = q.correctAnswerIndex !== null;
                const correct = hasAnswer && userAnswer === q.correctAnswerIndex;
                return (
                  <li key={q.id} className="flex items-start gap-4 py-4">
                    <div className="mt-0.5 shrink-0">
                      {!hasAnswer ? (
                        <span className="flex h-5 w-5 items-center justify-center text-zinc-300">—</span>
                      ) : correct ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {i + 1}. {q.questionText}
                      </p>
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt, oi) => {
                          let badge = '';
                          if (hasAnswer && oi === q.correctAnswerIndex) badge = 'correct';
                          if (hasAnswer && oi === userAnswer && oi !== q.correctAnswerIndex) badge = 'wrong';
                          if (!hasAnswer && oi === userAnswer) badge = 'selected';
                          return (
                            <p
                              key={oi}
                              className={`text-sm ${
                                badge === 'correct'
                                  ? 'font-medium text-emerald-700'
                                  : badge === 'wrong'
                                  ? 'font-medium text-red-700 line-through'
                                  : badge === 'selected'
                                  ? 'font-medium text-blue-700'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {String.fromCharCode(65 + oi)}. {opt}
                              {badge === 'correct' && ' \u2713'}
                              {badge === 'selected' && ' \u2022'}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
