import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const banksDir = path.join(process.cwd(), 'banks');

  try {
    if (!fs.existsSync(banksDir)) {
      return NextResponse.json({ banks: [] });
    }

    const files = fs.readdirSync(banksDir).filter(f => f.endsWith('.json'));
    const banks: {
      id: string;
      filename: string;
      displayName: string;
      quizTitle: string;
      questionCount: number;
      questions: object[];
    }[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(banksDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (!data.quizTitle || !Array.isArray(data.questions)) continue;

        const id = file.replace(/\.json$/, '');
        const displayName = id
          .split(/[_-]/)
          .map(word => (word.length <= 3 || /^[^aeiou]+$/i.test(word)) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        banks.push({
          id,
          filename: file,
          displayName,
          quizTitle: data.quizTitle,
          questionCount: data.questions.length,
          questions: data.questions,
        });
      } catch {
        // skip invalid files
      }
    }

    return NextResponse.json({ banks });
  } catch {
    return NextResponse.json({ banks: [] });
  }
}
