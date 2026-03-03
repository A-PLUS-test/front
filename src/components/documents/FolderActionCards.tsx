import React from 'react';
import { BookOpen, FileQuestion, Upload } from 'lucide-react';

interface FolderActionCardsProps {
  onUpload: () => void;
  onCombinedQuizAction?: () => void;
  canCreateCombinedQuiz?: boolean;
  onVocabularyAction: () => void;
  canOpenVocabulary: boolean;
}

const FolderActionCards: React.FC<FolderActionCardsProps> = ({
  onUpload,
  onCombinedQuizAction,
  canCreateCombinedQuiz = false,
  onVocabularyAction,
  canOpenVocabulary,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <button
        onClick={onUpload}
        className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
      >
        <Upload className="h-8 w-8 text-[#22C7FB] mb-3" />
        <h3 className="font-semibold text-gray-900">파일 업로드</h3>
        <p className="text-sm text-gray-600 mt-1">새 자료 추가하기</p>
      </button>

      {onCombinedQuizAction ? (
        <button
          onClick={onCombinedQuizAction}
          className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-left transition-shadow ${
            canCreateCombinedQuiz ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
          }`}
        >
          <FileQuestion className="h-8 w-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900">전체 문제 만들기</h3>
          <p className="text-sm text-gray-600 mt-1">폴더 내 PDF로 퀴즈 생성</p>
        </button>
      ) : (
        <div />
      )}

      <button
        onClick={onVocabularyAction}
        className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-left transition-shadow ${
          canOpenVocabulary ? 'hover:shadow-md' : 'opacity-50 cursor-not-allowed'
        }`}
      >
        <BookOpen className="h-8 w-8 text-purple-600 mb-3" />
        <h3 className="font-semibold text-gray-900">단어장 보기</h3>
        <p className="text-sm text-gray-600 mt-1">영어 문서 단어 학습</p>
      </button>
    </div>
  );
};

export default FolderActionCards;
