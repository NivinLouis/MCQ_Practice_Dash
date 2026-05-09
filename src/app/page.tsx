'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, BarChart3, BookOpen, Trash2, Play, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStoredQuizzes, saveQuiz, deleteQuiz, getQuizStats, getResult } from '@/lib/storage';
import { validateQuizJson, generateId } from '@/lib/validation';
import { StoredQuiz, Question } from '@/lib/types';

interface BankMeta {
  id: string;
  displayName: string;
  quizTitle: string;
  questionCount: number;
  questions: Question[];
}

export default function Dashboard() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<StoredQuiz[]>(getStoredQuizzes);
  const [stats, setStats] = useState(getQuizStats);
  const [banks, setBanks] = useState<BankMeta[]>([]);

  const refresh = useCallback(() => {
    setQuizzes(getStoredQuizzes());
    setStats(getQuizStats());
  }, []);

  useEffect(() => {
    fetch('/api/banks')
      .then(res => res.json() as Promise<{ banks: BankMeta[] }>)
      .then(data => setBanks(data.banks || []))
      .catch(() => {});
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const { valid, errors } = validateQuizJson(data);
        if (!valid) { setUploadError(errors.map(e => e.message).join(', ')); return; }
        const quiz: StoredQuiz = {
          id: generateId(),
          quizTitle: data.quizTitle,
          questions: data.questions,
          uploadedAt: new Date().toISOString(),
        };
        setUploadError(null);
        saveQuiz(quiz);
        refresh();
      } catch {
        setUploadError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDelete = (id: string) => {
    deleteQuiz(id);
    refresh();
  };

  const startQuiz = (id: string) => {
    router.push(`/quiz/${id}`);
  };

  const launchBank = (bank: BankMeta) => {
    const existing = getStoredQuizzes().find(q => q.id === bank.id);
    if (!existing) {
      const quiz: StoredQuiz = {
        id: bank.id,
        quizTitle: bank.quizTitle,
        questions: bank.questions,
        uploadedAt: new Date().toISOString(),
      };
      saveQuiz(quiz);
    }
    router.push(`/quiz/${bank.id}`);
  };

  const hasResult = (id: string) => !!getResult(id);

  const storedIds = new Set(quizzes.map(q => q.id));
  const availableBanks = banks.filter(b => !storedIds.has(b.id));

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-zinc-900" />
            <h1 className="text-xl font-bold">Quiz Practice</h1>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative group">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                title="Upload question bank"
              >
                <Upload className="h-5 w-5" />
              </button>
              <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-lg border bg-white p-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none">
                <p className="mb-2 text-xs font-semibold text-zinc-500">Expected JSON structure:</p>
                <pre className="overflow-x-auto rounded bg-zinc-50 p-2 text-[10px] leading-relaxed text-zinc-700">{`{
  "quizTitle": "String",
  "questions": [
    {
      "id": "String or Number",
      "questionText": "String",
      "options": ["A","B","C","D"],
      "correctAnswerIndex": 0-3 or null,
      "explanation": "String (optional)"
    }
  ]
}`}</pre>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        {uploadError && (
          <div className="mx-auto max-w-4xl px-4 pb-3">
            <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">{uploadError}</div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold">{stats.totalBanks + banks.length}</p>
                <p className="text-sm text-zinc-500">Question Banks</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold">{stats.totalQuizzesTaken}</p>
                <p className="text-sm text-zinc-500">Quizzes Taken</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold">
                  {stats.totalQuizzesTaken > 0 ? `${Math.round(stats.averageScore)}%` : '\u2014'}
                </p>
                <p className="text-sm text-zinc-500">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {availableBanks.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Available Banks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableBanks.map((bank) => (
                  <button
                    key={bank.id}
                    onClick={() => launchBank(bank)}
                    className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                      <Play className="h-5 w-5 text-zinc-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{bank.displayName}</p>
                      <p className="truncate text-xs text-zinc-400">{bank.quizTitle}</p>
                      <p className="text-xs text-zinc-400">{bank.questionCount} questions</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Question Banks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-400">
                No question banks selected yet. Choose one from Available Banks above.
              </p>
            ) : (
              <ul className="divide-y">
                {quizzes.map((quiz) => {
                  const done = hasResult(quiz.id);
                  return (
                    <li key={quiz.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{quiz.quizTitle}</p>
                        <p className="text-xs text-zinc-400">
                          {quiz.questions.length} questions &middot;{' '}
                          {new Date(quiz.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        {done && (
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/results/${quiz.id}`)}>
                            View Results
                          </Button>
                        )}
                        <Button size="sm" onClick={() => startQuiz(quiz.id)}>
                          {done ? 'Retake' : 'Start Quiz'}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(quiz.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
