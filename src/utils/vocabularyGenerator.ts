import openai from '../lib/openai';
import type { VocabularyItem } from '../types';

// OpenAI를 사용하여 단어 사전 생성
export const generateVocabulary = async (
  documentContent: string,
  _pages: { pageNumber: number; content: string }[]
): Promise<VocabularyItem[]> => {
  try {
    const prompt = `다음 영문 학습 자료에서 중요한 학술 용어와 어려운 단어들을 추출하여 단어 사전을 만들어주세요. 
각 단어는 다음 형식의 JSON 배열로 반환해주세요:

[
  {
    "word": "영어 단어",
    "meaning": "한국어 뜻 (간결하게)",
    "context": "문서에서 사용된 문장 (선택적)",
    "pageNumber": 페이지 번호 (정수)
  }
]

최대 50개의 단어를 추출하되, 학습에 도움이 되는 중요하고 어려운 단어 위주로 선택해주세요.
일반적인 기초 단어보다는 전문 용어와 학술 용어를 우선시해주세요.

학습 자료:
${documentContent.substring(0, 10000)}

중요: 응답은 반드시 유효한 JSON 배열 형식이어야 합니다.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 언어 교육 전문가입니다. 영문 자료에서 학습에 중요한 단어를 추출하고 한국어 뜻을 제공합니다.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content_text = response.choices[0].message.content || '{}';
    
    try {
      const parsed = JSON.parse(content_text);
      const vocabularyData = parsed.vocabulary || parsed.words || parsed;
      const vocabularyArray = Array.isArray(vocabularyData) ? vocabularyData : [vocabularyData];
      
      return vocabularyArray.map((v: any, index: number) => ({
        id: `vocab_${Date.now()}_${index}`,
        word: v.word,
        meaning: v.meaning,
        context: v.context,
        pageNumber: v.pageNumber || 1,
      }));
    } catch (error) {
      console.error('JSON 파싱 실패:', content_text);
      throw new Error('AI 응답 형식이 올바르지 않습니다.');
    }
  } catch (error) {
    console.error('단어 사전 생성 실패:', error);
    throw new Error('단어 사전 생성에 실패했습니다. OpenAI API 키를 확인해주세요.');
  }
};

// 단어 의미 검색 (추가 기능)
export const lookupWord = async (word: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 영한 사전입니다. 영어 단어의 한국어 뜻을 간결하게 설명합니다.',
        },
        {
          role: 'user',
          content: `"${word}"의 한국어 뜻을 알려주세요. (간결하게 1-2문장으로)`,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || '뜻을 찾을 수 없습니다.';
  } catch (error) {
    console.error('단어 검색 실패:', error);
    throw new Error('단어 검색에 실패했습니다.');
  }
};
