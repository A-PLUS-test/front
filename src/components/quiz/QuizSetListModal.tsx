import React from 'react';
import { FileQuestion, Plus } from 'lucide-react';
import type { Document, QuizSet } from '../../types';

interface QuizSetListModalProps {
  document: Document;
  quizSets: QuizSet[];
  onClose: () => void;
  onViewQuiz: (quizSetId: string) => void;
  onCreateQuiz: (doc: Document) => void;
}

const QuizSetListModal: React.FC<QuizSetListModalProps> = ({
  document,
  quizSets,
  onClose,
  onViewQuiz,
  onCreateQuiz,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{document.fileName}의 문제 목록</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
          {quizSets.map((quizSet) => (
            <div
              key={quizSet.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-[#22C7FB]/50 hover:bg-[#22C7FB]/10 transition-colors cursor-pointer"
              onClick={() => onViewQuiz(quizSet.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileQuestion className="h-5 w-5 text-[#22C7FB]" />
                    <h4 className="font-medium text-gray-900">{quizSet.title}</h4>
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <span>총 {quizSet.questions.length}문제</span>
                    <span>•</span>
                    <span>{new Date(quizSet.createdAt).toLocaleDateString()}</span>
                  </div>
                  {quizSet.settings && (
                    <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                      {quizSet.settings.multipleChoiceCount > 0 && (
                        <span>객관식 {quizSet.settings.multipleChoiceCount}개</span>
                      )}
                      {quizSet.settings.shortAnswerCount > 0 && (
                        <span>단답형 {quizSet.settings.shortAnswerCount}개</span>
                      )}
                      {quizSet.settings.essayCount > 0 && (
                        <span>서술형 {quizSet.settings.essayCount}개</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewQuiz(quizSet.id);
                  }}
                  className="ml-4 px-3 py-1 text-sm font-medium text-[#0e8fb8] bg-[#22C7FB]/10 hover:bg-[#22C7FB]/20 rounded"
                >
                  풀기
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={() => onCreateQuiz(document)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#22C7FB] text-white rounded-lg hover:bg-[#1BB0E0] transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>추가 문제 만들기</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizSetListModal;
