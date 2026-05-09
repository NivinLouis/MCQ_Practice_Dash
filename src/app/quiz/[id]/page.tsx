'use client';

import { useState, useCallback, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Flag, CheckCheck, ClipboardCopy, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuizById, getProgress, saveProgress, computeResult } from '@/lib/storage';
import { StoredQuiz } from '@/lib/types';
import Link from 'next/link';

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [quiz] = useState<StoredQuiz | null>(() => getQuizById(id) ?? null);

  const initialProgress = quiz ? getProgress(id) : { currentIndex: 0, answers: {}, completed: false };
  const [currentIndex, setCurrentIndex] = useState(initialProgress.currentIndex);
  const [answers, setAnswers] = useState<Record<string, number>>(initialProgress.answers);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const lockedQuestions: Record<string, boolean> = {};
  Object.keys(answers).forEach((qId) => { lockedQuestions[qId] = true; });

  useEffect(() => {
    if (!quiz) router.push('/');
  }, [quiz, router]);

  const persistProgress = useCallback((index: number, ans: Record<string, number>) => {
    saveProgress(id, { currentIndex: index, answers: ans, completed: false });
  }, [id]);

  if (!quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading quiz...</p>
      </div>
    );
  }

  const questions = quiz.questions;
  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === total - 1;
  const isLocked = lockedQuestions[String(currentQuestion.id)] || false;
  const selectedAnswer = answers[String(currentQuestion.id)];
  const hasAnswer = currentQuestion.correctAnswerIndex !== null;
  const isCorrect = hasAnswer && selectedAnswer === currentQuestion.correctAnswerIndex;

  const handleOptionClick = (optionIndex: number) => {
    if (isLocked) return;

    const qId = String(currentQuestion.id);
    const newAnswers = { ...answers, [qId]: optionIndex };

    setAnswers(newAnswers);
    persistProgress(currentIndex, newAnswers);
  };

  const goNext = () => {
    if (currentIndex < total - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      persistProgress(newIndex, answers);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      persistProgress(newIndex, answers);
    }
  };

  const finishQuiz = () => {
    const result = computeResult(id);
    if (result) {
      saveProgress(id, { currentIndex, answers, completed: true });
      router.push(`/results/${id}`);
    }
  };

  const handleCopy = async () => {
    const q = currentQuestion;
    const suffix = hasAnswer
      ? `My answer was option ${(answers[String(q.id)] ?? -1) + 1}. Please explain the correct answer.`
      : 'I\'m unsure about this question. Please explain the correct answer.';
    const text = `Question: ${q.questionText}\n\nOptions:\n${q.options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}\n\n${suffix}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(String(q.id));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // clipboard not available
    }
  };

  const getOptionStyle = (optionIndex: number) => {
    if (!isLocked) {
      return 'border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50';
    }
    if (!hasAnswer) {
      if (optionIndex === selectedAnswer) {
        return 'border-blue-500 bg-blue-50 text-blue-900';
      }
      return 'border-zinc-200 opacity-50';
    }
    if (optionIndex === currentQuestion.correctAnswerIndex) {
      return 'border-emerald-500 bg-emerald-50 text-emerald-900';
    }
    if (optionIndex === selectedAnswer && !isCorrect) {
      return 'border-red-500 bg-red-50 text-red-900';
    }
    return 'border-zinc-200 opacity-50';
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            &larr; Dashboard
          </Link>
          <h1 className="text-sm font-semibold truncate px-2">{quiz.quizTitle}</h1>
          <span className="text-xs text-zinc-400">
            {answeredCount}/{total} answered
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-zinc-500">
              Question {currentIndex + 1} of {total}
            </span>
            <span className="text-xs text-zinc-400">
              {Math.round(((currentIndex + 1) / total) * 100)}% complete
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-zinc-200">
            <div
              className="h-2 rounded-full bg-zinc-900 transition-all"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg leading-relaxed">
              {currentQuestion.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(index)}
                  disabled={isLocked}
                  className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left text-sm transition-all ${getOptionStyle(index)}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-xs font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1">{option}</span>
                  {isLocked && hasAnswer && index === currentQuestion.correctAnswerIndex && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                  {isLocked && hasAnswer && index === selectedAnswer && !isCorrect && (
                    <XCircle className="h-5 w-5 shrink-0 text-red-600" />
                  )}
                </button>
              ))}
            </div>

            {isLocked && (!hasAnswer || !isCorrect) && (
              <div className="mt-6">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                  {copiedId === String(currentQuestion.id) ? (
                    <>
                      <CheckCheck className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardCopy className="h-4 w-4" />
                      Copy for AI Explanation
                    </>
                  )}
                </Button>
              </div>
            )}

            {isLocked && currentQuestion.explanation && (
              <div className="mt-4 rounded-md bg-blue-50 p-4 text-sm text-blue-800">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={currentIndex === 0} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {isLast ? (
            <Button onClick={finishQuiz} className="gap-2" disabled={answeredCount < total}>
              <Flag className="h-4 w-4" />
              Finish Quiz
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={goNext} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
