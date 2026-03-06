import type { Question, QuizSettings } from '../types';
import { apiFetch } from './apiClient';

// 백엔드 API를 통해 문제 생성
export const generateQuestions = async (
  documentContent: string,
  pages: { pageNumber: number; content: string }[],
  settings: QuizSettings
): Promise<Question[]> => {
  try {
    const response = await apiFetch('/api/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentContent, pages, settings }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '문제 생성에 실패했습니다.');
    }

    const data = await response.json();
    return data.questions as Question[];
  } catch (error: any) {
    console.error('문제 생성 실패:', error);
    throw new Error('서버 에러 발생');
  }
};

// 백엔드 API를 통해 서술형 답변 채점
export const gradeEssayAnswer = async (
  question: string,
  studentAnswer: string,
  modelAnswer: string
): Promise<{ score: number; feedback: string }> => {
  const response = await apiFetch('/api/grade-essay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, studentAnswer, modelAnswer }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || '채점에 실패했습니다.');
  }

  const data = await response.json();
  return {
    score: data.score || 0,
    feedback: data.feedback || '채점 결과를 생성할 수 없습니다.',
  };
};
