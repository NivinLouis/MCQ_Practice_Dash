# Quiz Practice

A client-side MCQ practice app built with **Next.js (App Router)**, **Tailwind CSS**, and **shadcn/ui**. All data stays in your browser via `localStorage` — no backend required.

---

## Features

- **Dashboard** — View stats, pick a question bank, or upload a custom `.json` file
- **Quiz Interface** — One question at a time with instant green/red feedback, "Copy for AI Explanation" on wrong answers, and Next/Previous navigation
- **Results Page** — Score summary with a full question-by-question review
- **Local Question Banks** — Drop `.json` files into `banks/` and they appear automatically (file names are formatted for display)
- **Upload Support** — Upload additional `.json` files via the header icon (hover to see the expected schema)

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Data Schema

Uploaded or local `.json` files must match this structure:

```json
{
  "quizTitle": "Operating Systems 2021",
  "questions": [
    {
      "id": 1,
      "questionText": "Which scheduling algorithm allocates the CPU first?",
      "options": ["FCFS", "SJF", "Priority Scheduling", "Round Robin"],
      "correctAnswerIndex": 0,
      "explanation": "FCFS is the simplest scheduling algorithm."
    }
  ]
}
```

- `correctAnswerIndex` must be `0–3`, or `null` if no answer key is available (questions without an answer key won't be graded — use the Copy button to look them up)
- `explanation` is optional

---

## AI Workflow (PDF → JSON)

Paste this prompt into an AI chatbot (Gemini, ChatGPT, Claude) along with your question paper to generate the required JSON:

> You are a precise data extraction assistant. Extract all questions and multiple-choice options, format them strictly into this JSON schema:
>
> ```json
> {
>   "quizTitle": "Logical title",
>   "questions": [
>     {
>       "id": 1,
>       "questionText": "Exact question text",
>       "options": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
>       "correctAnswerIndex": 0,
>       "explanation": "Any reasoning provided, or empty string"
>     }
>   ]
> }
> ```
>
> **Rules:**
> 1. Check for an answer key. If present, set `correctAnswerIndex` (0–3). If missing, set to `null`. Do not guess.
> 2. Always exactly 4 options.
> 3. Strip question numbers (Q1) and option letters (A, B).
> 4. Output raw JSON only.

Generated files go into `banks/` — the app picks them up automatically on the next page load.

---

## Tech Stack

| Layer              | Tool                        |
| ------------------ | --------------------------- |
| Framework          | Next.js (App Router)        |
| Styling            | Tailwind CSS                |
| Components         | shadcn/ui                   |
| Icons              | Lucide React                |
| State Management   | React Hooks + localStorage  |

---

## Local Question Banks

Place `.json` files inside the `banks/` directory at the project root. The app reads them on load and displays each one as a selectable card. File names are cleaned up for display — no need to follow a strict naming convention.
