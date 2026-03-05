import openai from '../lib/openai';
import type { Question, QuizSettings } from '../types';
import { QuestionType } from '../types';

// 더미 문제 생성 (OpenAI API 없이 테스트용)
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

// OpenAI를 사용하여 문제 생성
export const generateQuestions = async (
  documentContent: string,
  pages: { pageNumber: number; content: string }[],
  settings: QuizSettings
): Promise<Question[]> => {
  const questions: Question[] = [];

  try {
    // OpenAI API 키가 없거나 더미인 경우 샘플 문제 생성
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key_here' || apiKey.includes('dummy')) {
      console.log('OpenAI API 키가 없어 샘플 문제를 생성합니다.');
      return generateDummyQuestions(settings);
    }

    // 객관식 문제 생성
    if (settings.multipleChoiceCount > 0) {
      const mcQuestions = await generateMultipleChoiceQuestions(
        documentContent,
        pages,
        settings.multipleChoiceCount
      );
      questions.push(...mcQuestions);
    }

    // 단답식 문제 생성
    if (settings.shortAnswerCount > 0) {
      const saQuestions = await generateShortAnswerQuestions(
        documentContent,
        pages,
        settings.shortAnswerCount
      );
      questions.push(...saQuestions);
    }

    // 서술형 문제 생성
    if (settings.essayCount > 0) {
      const essayQuestions = await generateEssayQuestions(
        documentContent,
        pages,
        settings.essayCount
      );
      questions.push(...essayQuestions);
    }

    return questions;
  } catch (error: any) {
    console.error('문제 생성 실패:', error);
    
    // API 할당량 초과 또는 에러 시 샘플 문제 반환
    if (error.status === 429 || error.message?.includes('quota')) {
      console.log('OpenAI API 할당량 초과. 샘플 문제를 생성합니다.');
      return generateDummyQuestions(settings);
    }
    
    throw new Error('문제 생성에 실패했습니다. OpenAI API 키를 확인해주세요.');
  }
};

// 객관식 문제 생성
const generateMultipleChoiceQuestions = async (
  content: string,
  _pages: { pageNumber: number; content: string }[],
  count: number
): Promise<Question[]> => {
  const prompt = `다음 학습 자료를 바탕으로 ${count}개의 객관식 문제를 생성해주세요. 
각 문제는 다음 형식의 JSON 배열로 반환해주세요:

[
  {
    "question": "문제 내용",
    "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
    "correctAnswer": "정답 (선택지 중 하나)",
    "explanation": "해설",
    "pageNumber": 페이지 번호 (정수)
  }
]

학습 자료:
${content.substring(0, 8000)}

중요: 응답은 반드시 유효한 JSON 배열 형식이어야 합니다.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 교육 전문가입니다. 학습 자료를 분석하여 양질의 객관식 문제를 생성합니다.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content_text = response.choices[0].message.content || '{}';
  let parsed;
  
  try {
    parsed = JSON.parse(content_text);
    // response_format: json_object를 사용하면 배열이 아닌 객체로 감싸져 올 수 있음
    const questionsData = parsed.questions || parsed;
    const questionsArray = Array.isArray(questionsData) ? questionsData : [questionsData];
    
    return questionsArray.map((q: any, index: number) => ({
      id: `mc_${Date.now()}_${index}`,
      type: QuestionType.MULTIPLE_CHOICE,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      pageNumber: q.pageNumber || 1,
    }));
  } catch (error) {
    console.error('JSON 파싱 실패:', content_text);
    throw new Error('AI 응답 형식이 올바르지 않습니다.');
  }
};

// 단답식 문제 생성
const generateShortAnswerQuestions = async (
  content: string,
  _pages: { pageNumber: number; content: string }[],
  count: number
): Promise<Question[]> => {
  const prompt = `다음 학습 자료를 바탕으로 ${count}개의 단답식 문제를 생성해주세요. 
각 문제는 다음 형식의 JSON 배열로 반환해주세요:

[
  {
    "question": "문제 내용",
    "correctAnswer": "정답 (짧은 답변)",
    "explanation": "해설",
    "pageNumber": 페이지 번호 (정수)
  }
]

학습 자료:
${content.substring(0, 8000)}

중요: 응답은 반드시 유효한 JSON 배열 형식이어야 합니다.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 교육 전문가입니다. 학습 자료를 분석하여 양질의 단답식 문제를 생성합니다.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content_text = response.choices[0].message.content || '{}';
  
  try {
    const parsed = JSON.parse(content_text);
    const questionsData = parsed.questions || parsed;
    const questionsArray = Array.isArray(questionsData) ? questionsData : [questionsData];
    
    return questionsArray.map((q: any, index: number) => ({
      id: `sa_${Date.now()}_${index}`,
      type: QuestionType.SHORT_ANSWER,
      question: q.question,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      pageNumber: q.pageNumber || 1,
    }));
  } catch (error) {
    console.error('JSON 파싱 실패:', content_text);
    throw new Error('AI 응답 형식이 올바르지 않습니다.');
  }
};

// 서술형 문제 생성
const generateEssayQuestions = async (
  content: string,
  _pages: { pageNumber: number; content: string }[],
  count: number
): Promise<Question[]> => {
  const prompt = `다음 학습 자료를 바탕으로 ${count}개의 서술형 문제를 생성해주세요. 
각 문제는 다음 형식의 JSON 배열로 반환해주세요:

[
  {
    "question": "문제 내용 (깊이 있는 사고를 요구하는 질문)",
    "explanation": "모범 답안 및 평가 기준",
    "pageNumber": 페이지 번호 (정수)
  }
]

학습 자료:
${content.substring(0, 8000)}

중요: 응답은 반드시 유효한 JSON 배열 형식이어야 합니다.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 교육 전문가입니다. 학습 자료를 분석하여 깊이 있는 서술형 문제를 생성합니다.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content_text = response.choices[0].message.content || '{}';
  
  try {
    const parsed = JSON.parse(content_text);
    const questionsData = parsed.questions || parsed;
    const questionsArray = Array.isArray(questionsData) ? questionsData : [questionsData];
    
    return questionsArray.map((q: any, index: number) => ({
      id: `essay_${Date.now()}_${index}`,
      type: QuestionType.ESSAY,
      question: q.question,
      explanation: q.explanation,
      pageNumber: q.pageNumber || 1,
    }));
  } catch (error) {
    console.error('JSON 파싱 실패:', content_text);
    throw new Error('AI 응답 형식이 올바르지 않습니다.');
  }
};

// 서술형 답변 채점
export const gradeEssayAnswer = async (
  question: string,
  studentAnswer: string,
  modelAnswer: string
): Promise<{ score: number; feedback: string }> => {
  const prompt = `다음 서술형 문제에 대한 학생의 답변을 채점해주세요.

문제: ${question}

모범 답안: ${modelAnswer}

학생 답변: ${studentAnswer}

채점 기준(총 100점, 부분점수 허용):
- 내용 일치도(0~60): 핵심 개념 포함 여부, 논리적 정합성. 핵심이 전혀 없으면 0점.
- 근거·구체성(0~20): 근거 제시, 예시, 데이터 등 구체적 설명. 근거가 없으면 0점.
- 구조·명확성(0~10): 서술의 조직, 문장 명료도.
- 학술적 정확성/용어(0~10): 용어 사용, 사실 정확성. 오류 있으면 감점.

주의:
- 질문과 무관하거나 무의미한 답변은 0점.
- 모범 답안의 핵심 요소가 50% 미만이면 총점은 20점을 넘기지 마세요.
- 답이 비어 있거나 공백/의미 없는 문자열이면 0점.
- 점수는 정수.

다음 형식의 JSON으로 응답해주세요:
{
  "score": 0-100 사이의 점수 (정수),
  "feedback": "구체적인 피드백 (잘한 점, 부족한 점, 개선 방향)"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '당신은 공정하고 세심한 교육 평가 전문가입니다.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  const content_text = response.choices[0].message.content || '{}';
  const result = JSON.parse(content_text);
  
  return {
    score: result.score || 0,
    feedback: result.feedback || '채점 결과를 생성할 수 없습니다.',
  };
};
