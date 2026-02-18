// 사용자 타입
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// 문제 타입
export const QuestionType = {
  MULTIPLE_CHOICE: 'multiple_choice',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
} as const;

export type QuestionType = typeof QuestionType[keyof typeof QuestionType];

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // 객관식 선택지
  correctAnswer?: string; // 객관식 정답 또는 단답식 정답
  explanation?: string;
  pageNumber?: number; // 출처 페이지
  documentId?: string; // 출처 문서
}

export interface Answer {
  questionId: string;
  userAnswer: string;
  isCorrect?: boolean;
  score?: number;
  feedback?: string; // AI 피드백 (서술형용)
}

// 문서 타입
export interface Document {
  id: string;
  userId: string;
  fileName: string;
  fileType: 'pdf' | 'pptx' | 'docx';
  fileUrl: string;
  uploadedAt: Date;
  processedAt?: Date;
  isProcessed: boolean;
  language?: 'ko' | 'en' | 'other';
  folderId?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
}

// 폴더 타입
export interface Folder {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}

// 퀴즈 세트 타입
export interface QuizSet {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  questions: Question[];
  createdAt: Date;
  settings: QuizSettings;
}

export interface QuizSettings {
  multipleChoiceCount: number;
  shortAnswerCount: number;
  essayCount: number;
  totalQuestions: number;
}

// 단어 사전 타입
export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  context?: string; // 문서에서 사용된 맥락
  pageNumber?: number;
  documentId?: string;
}

export interface VocabularySet {
  id: string;
  userId: string;
  documentId: string;
  title: string;
  words: VocabularyItem[];
  createdAt: Date;
}

// 퀴즈 결과 타입
export interface QuizResult {
  id: string;
  userId: string;
  quizSetId: string;
  answers: Answer[];
  score: number;
  totalQuestions: number;
  completedAt: Date;
}
