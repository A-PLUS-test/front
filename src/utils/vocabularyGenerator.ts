import type { VocabularyItem } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 백엔드 API를 통해 단어 사전 생성
export const generateVocabulary = async (
  documentContent: string,
  pages: { pageNumber: number; content: string }[]
): Promise<VocabularyItem[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-vocabulary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentContent, pages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '단어 사전 생성에 실패했습니다.');
    }

    const data = await response.json();
    return data.words as VocabularyItem[];
  } catch (error: any) {
    console.error('단어 사전 생성 실패:', error);
    throw new Error(error.message || '단어 사전 생성에 실패했습니다.');
  }
};

// 백엔드 API를 통해 단어 의미 검색
export const lookupWord = async (word: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/lookup-word`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || '단어 검색에 실패했습니다.');
    }

    const data = await response.json();
    return data.meaning || '뜻을 찾을 수 없습니다.';
  } catch (error: any) {
    console.error('단어 검색 실패:', error);
    throw new Error(error.message || '단어 검색에 실패했습니다.');
  }
};
