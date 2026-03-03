import type { Question, QuizSettings } from '../types';
import { QuestionType } from '../types';
import { apiFetch } from './apiClient';

// 더미 문제 생성 (API 실패 시 fallback)
const generateDummyQuestions = (settings: QuizSettings): Question[] => {
  const questions: Question[] = [];
  
  // 객관식
  for (let i = 0; i < settings.multipleChoiceCount; i++) {
    questions.push({
      id: `mc_${Date.now()}_${i}`,
      type: QuestionType.MULTIPLE_CHOICE,
      question: `샘플 객관식 문제 ${i + 1}번: 이것은 테스트용 문제입니다.`,
      options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4'],
      correctAnswer: '선택지 1',
      explanation: '이것은 샘플 해설입니다.',
      pageNumber: 1,
    });
  }
  
  // 단답식
  for (let i = 0; i < settings.shortAnswerCount; i++) {
    questions.push({
      id: `sa_${Date.now()}_${i}`,
      type: QuestionType.SHORT_ANSWER,
      question: `샘플 단답식 문제 ${i + 1}번: 이것은 테스트용 문제입니다.`,
      correctAnswer: '샘플 정답',
      explanation: '이것은 샘플 해설입니다.',
      pageNumber: 1,
    });
  }
  
  // 서술형
  for (let i = 0; i < settings.essayCount; i++) {
    questions.push({
      id: `essay_${Date.now()}_${i}`,
      type: QuestionType.ESSAY,
      question: `샘플 서술형 문제 ${i + 1}번: 이것은 테스트용 문제입니다. 자유롭게 답변해보세요.`,
      explanation: '이것은 샘플 모범답안 및 평가 기준입니다.',
      pageNumber: 1,
    });
  }
  
  return questions;
};

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

    // 네트워크 오류 등일 때 더미 문제 반환
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.log('API 서버에 연결할 수 없어 샘플 문제를 생성합니다.');
      return generateDummyQuestions(settings);
    }

    throw new Error(error.message || '문제 생성에 실패했습니다.');
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
