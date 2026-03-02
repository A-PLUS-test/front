import React from 'react';
import { BookOpen, FileQuestion } from 'lucide-react';

interface DocumentLearningActionsProps {
  quizSetCount: number;
  vocabularySetCount: number;
  isKoreanDocument?: boolean;
  onVocabularyBlocked?: () => void;
  onViewQuizzes: () => void;
  onCreateQuiz: () => void;
  onViewVocabulary: () => void;
  onCreateVocabulary: () => void;
  className?: string;
}

const DocumentLearningActions: React.FC<DocumentLearningActionsProps> = ({
  quizSetCount,
  vocabularySetCount,
  isKoreanDocument = false,
  onVocabularyBlocked,
  onViewQuizzes,
  onCreateQuiz,
  onViewVocabulary,
  onCreateVocabulary,
  className = 'flex items-center space-x-2 ml-4',
}) => {
  const handleVocabularyBlocked = () => {
    if (onVocabularyBlocked) {
      onVocabularyBlocked();
      return;
    }

    window.alert('한글 샘플은 단어장을 만들 수 없습니다.');
  };

  const handleVocabularyActionClick = () => {
    if (isKoreanDocument) {
      handleVocabularyBlocked();
      return;
    }

    if (vocabularySetCount > 0) {
      onViewVocabulary();
      return;
    }

    onCreateVocabulary();
  };

  return (
    <div className={className}>
      {quizSetCount > 0 ? (
        <button
          onClick={onViewQuizzes}
          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200"
          title="문제 보기"
        >
          <FileQuestion className="h-4 w-4 inline mr-1" />
          문제 보기 ({quizSetCount})
        </button>
      ) : (
        <button
          onClick={onCreateQuiz}
          className="px-3 py-1 text-xs font-medium text-[#0e8fb8] bg-[#22C7FB]/10 hover:bg-[#22C7FB]/20 rounded border border-[#22C7FB]/30"
          title="문제 만들기"
        >
          <FileQuestion className="h-4 w-4 inline mr-1" />
          문제 만들기
        </button>
      )}

      {vocabularySetCount > 0 ? (
        <button
          onClick={handleVocabularyActionClick}
          className={`px-3 py-1 text-xs font-medium rounded border ${
            isKoreanDocument
              ? 'text-gray-500 bg-gray-100 border-gray-300 cursor-not-allowed'
              : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200'
          }`}
          title="단어장 보기"
        >
          <BookOpen className="h-4 w-4 inline mr-1" />
          단어장 보기
        </button>
      ) : (
        <button
          onClick={handleVocabularyActionClick}
          className={`px-3 py-1 text-xs font-medium rounded border ${
            isKoreanDocument
              ? 'text-gray-500 bg-gray-100 border-gray-300 cursor-not-allowed'
              : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border-purple-200'
          }`}
          title="단어장 만들기"
        >
          <BookOpen className="h-4 w-4 inline mr-1" />
          단어장 만들기
        </button>
      )}
    </div>
  );
};

export default DocumentLearningActions;
