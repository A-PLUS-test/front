import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// PDF.js worker 설정 - jsdelivr CDN 사용 (더 안정적)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ExtractedContent {
  text: string;
  pages: { pageNumber: number; content: string }[];
  language?: 'ko' | 'en' | 'other';
}

// PDF 파일에서 텍스트 추출
export const extractTextFromPDF = async (file: File): Promise<ExtractedContent> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const pages: { pageNumber: number; content: string }[] = [];
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    pages.push({
      pageNumber: i,
      content: pageText,
    });
    
    fullText += pageText + '\n\n';
  }

  const language = detectLanguage(fullText);

  return {
    text: fullText,
    pages,
    language,
  };
};

// Word 파일에서 텍스트 추출
export const extractTextFromWord = async (file: File): Promise<ExtractedContent> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  
  const text = result.value;
  const language = detectLanguage(text);

  // Word 파일은 페이지 개념이 명확하지 않으므로 단락으로 구분
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const pages = paragraphs.map((content, index) => ({
    pageNumber: index + 1,
    content,
  }));

  return {
    text,
    pages,
    language,
  };
};

// PowerPoint 파일 처리 (간단한 구현 - 실제로는 더 복잡한 라이브러리 필요)
export const extractTextFromPPT = async (_file: File): Promise<ExtractedContent> => {
  // PPT 처리는 복잡하므로 여기서는 기본 구현만 제공
  // 실제로는 서버 사이드에서 처리하거나 더 전문적인 라이브러리 필요
  console.warn('PPT 파일 처리는 제한적입니다. PDF로 변환하여 업로드하는 것을 권장합니다.');
  
  return {
    text: '(PPT 파일 처리 제한)',
    pages: [],
    language: 'other',
  };
};

// 언어 감지 (간단한 휴리스틱)
const detectLanguage = (text: string): 'ko' | 'en' | 'other' => {
  const koreanRegex = /[가-힣]/g;
  const englishRegex = /[a-zA-Z]/g;
  
  const koreanMatches = text.match(koreanRegex) || [];
  const englishMatches = text.match(englishRegex) || [];
  
  const koreanRatio = koreanMatches.length / text.length;
  const englishRatio = englishMatches.length / text.length;
  
  if (koreanRatio > 0.1) return 'ko';
  if (englishRatio > 0.3) return 'en';
  return 'other';
};

// 파일 타입 확인
export const getFileType = (file: File): 'pdf' | 'pptx' | 'docx' | null => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'pdf') return 'pdf';
  if (extension === 'pptx' || extension === 'ppt') return 'pptx';
  if (extension === 'docx' || extension === 'doc') return 'docx';
  
  return null;
};

// 파일 처리 메인 함수
export const processFile = async (file: File): Promise<ExtractedContent> => {
  const fileType = getFileType(file);
  
  if (!fileType) {
    throw new Error('지원하지 않는 파일 형식입니다.');
  }
  
  switch (fileType) {
    case 'pdf':
      return await extractTextFromPDF(file);
    case 'docx':
      return await extractTextFromWord(file);
    case 'pptx':
      return await extractTextFromPPT(file);
    default:
      throw new Error('지원하지 않는 파일 형식입니다.');
  }
};
