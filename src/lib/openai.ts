import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // 주의: 프로덕션에서는 백엔드에서 처리하는 것이 안전합니다
});

export default openai;
