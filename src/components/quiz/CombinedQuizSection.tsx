import React from 'react';
import { FileQuestion, Trash2 } from 'lucide-react';
import type { QuizSet } from '../../types';

interface CombinedQuizSectionProps {
  quizSets: QuizSet[];
  onViewQuiz: (quizSetId: string) => void;
  onDeleteQuiz: (quizId: string, quizTitle: string) => void;
}

const CombinedQuizSection: React.FC<CombinedQuizSectionProps> = ({
  quizSets,
  onViewQuiz,
  onDeleteQuiz,
}) => {
  if (quizSets.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">혼합 문제</h2>
        <p className="text-sm text-gray-600 mt-1">여러 PDF에서 생성된 혼합 문제</p>
      </div>
      <div className="divide-y divide-gray-200">
        {quizSets.map((quizSet) => (
          <div key={quizSet.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => onViewQuiz(quizSet.id)}>
                <div className="flex items-center space-x-2">
                  <FileQuestion className="h-5 w-5 text-purple-600" />
                  <h3 className="font-medium text-gray-900">{quizSet.title}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    혼합 문제
                  </span>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span>총 {quizSet.questions.length}문제</span>
                  <span>•</span>
                  <span>{new Date(quizSet.createdAt).toLocaleDateString()}</span>
                </div>
                {quizSet.sourceDocuments && quizSet.sourceDocuments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quizSet.sourceDocuments.map((source, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        📄 {source.fileName} ({source.questionCount}문제)
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuiz(quizSet.id, quizSet.title);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewQuiz(quizSet.id);
                  }}
                  className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200"
                >
                  풀기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CombinedQuizSection;
