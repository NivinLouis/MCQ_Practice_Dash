import { ValidationError } from './types';

export function validateQuizJson(data: unknown): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({ message: 'Root must be a JSON object', path: 'root' });
    return { valid: false, errors };
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.quizTitle !== 'string' || obj.quizTitle.trim() === '') {
    errors.push({ message: 'quizTitle must be a non-empty string', path: 'quizTitle' });
  }

  if (!Array.isArray(obj.questions)) {
    errors.push({ message: 'questions must be an array', path: 'questions' });
    return { valid: false, errors };
  }

  if (obj.questions.length === 0) {
    errors.push({ message: 'questions array must not be empty', path: 'questions' });
    return { valid: false, errors };
  }

  obj.questions.forEach((q: unknown, index: number) => {
    const prefix = `questions[${index}]`;
    if (!q || typeof q !== 'object') {
      errors.push({ message: `Question at index ${index} must be an object`, path: prefix });
      return;
    }

    const question = q as Record<string, unknown>;

    if (question.id === undefined || question.id === null) {
      errors.push({ message: `Question ${index} is missing 'id'`, path: `${prefix}.id` });
    }

    if (typeof question.questionText !== 'string' || question.questionText.trim() === '') {
      errors.push({ message: `Question ${index} has invalid 'questionText'`, path: `${prefix}.questionText` });
    }

    if (!Array.isArray(question.options) || question.options.length !== 4) {
      errors.push({ message: `Question ${index} 'options' must be an array of exactly 4 strings`, path: `${prefix}.options` });
    } else {
      question.options.forEach((opt: unknown, oi: number) => {
        if (typeof opt !== 'string') {
          errors.push({ message: `Question ${index} option ${oi} must be a string`, path: `${prefix}.options[${oi}]` });
        }
      });
    }

    if (question.correctAnswerIndex !== null && (typeof question.correctAnswerIndex !== 'number' || question.correctAnswerIndex < 0 || question.correctAnswerIndex > 3)) {
      errors.push({ message: `Question ${index} 'correctAnswerIndex' must be a number between 0 and 3, or null`, path: `${prefix}.correctAnswerIndex` });
    }
  });

  return { valid: errors.length === 0, errors };
}

export function generateId(): string {
  return `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
