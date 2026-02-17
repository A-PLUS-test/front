import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Layout from '../components/Layout';
import { CheckCircle, XCircle, FileText, Home, RotateCcw, Loader, AlertCircle } from 'lucide-react';
import type { QuizResult as QuizResultType, QuizSet } from '../types';
import { QuestionType } from '../types';

const QuizResult: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<QuizResultType | null>(null);
  const [quiz, setQuiz] = useState<QuizSet | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnlyWrong, setShowOnlyWrong] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      if (!resultId) return;

      try {
        // 결과 불러오기
        const resultRef = doc(db, 'quizResults', resultId);
        const resultSnap = await getDoc(resultRef);

        if (resultSnap.exists()) {
          const resultData = { id: resultSnap.id, ...resultSnap.data() } as QuizResultType;
          setResult(resultData);

          // 퀴즈 정보 불러오기
          const quizRef = doc(db, 'quizzes', resultData.quizSetId);
          const quizSnap = await getDoc(quizRef);

          if (quizSnap.exists()) {
            setQuiz({ id: quizSnap.id, ...quizSnap.data() } as QuizSet);
          }
        }
      } catch (err) {
        console.error('결과 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  if (loading || !result || !quiz) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* 점수 카드 */}
          <div className={`rounded-lg border-2 p-8 mb-8 ${getScoreBackground(result.score)}`}>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">퀴즈 완료!</h1>
              <div className={`text-6xl font-bold mb-4 ${getScoreColor(result.score)}`}>
                {result.score}점
              </div>
              <p className="text-gray-600">
                {result.totalQuestions}문제 중{' '}
                {result.answers.filter(a => a.isCorrect).length}문제 정답
              </p>
            </div>

            <div className="flex justify-center space-x-4 mt-6">
              <Link
                to="/"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Home className="h-4 w-4 mr-2" />
                홈으로
              </Link>
              <button
                onClick={() => navigate(`/quiz/settings/${quiz.documentId}`)}
                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                다시 풀기
              </button>
            </div>
          </div>

          {/* 오답노트 필터 */}
          {result.answers.filter(a => !a.isCorrect && (a.score === undefined || a.score < 60)).length > 0 && (
            <div className="mb-6 flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-gray-900">
                  틀린 문제: {result.answers.filter(a => !a.isCorrect && (a.score === undefined || a.score < 60)).length}개
                </span>
              </div>
              <button
                onClick={() => setShowOnlyWrong(!showOnlyWrong)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showOnlyWrong
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showOnlyWrong ? '전체 보기' : '오답만 보기'}
              </button>
            </div>
          )}

          {/* 문제별 결과 */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">상세 결과</h2>

            {quiz.questions.map((question, index) => {
              const answer = result.answers.find(a => a.questionId === question.id);
              if (!answer) return null;

              // 오답노트 필터
              const isWrong = !answer.isCorrect && (answer.score === undefined || answer.score < 60);
              if (showOnlyWrong && !isWrong) return null;

              return (
                <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
                  {/* 문제 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          문제 {index + 1}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {question.type === QuestionType.MULTIPLE_CHOICE && '객관식'}
                          {question.type === QuestionType.SHORT_ANSWER && '단답식'}
                          {question.type === QuestionType.ESSAY && '서술형'}
                        </span>
                        {question.pageNumber && (
                          <span className="flex items-center text-sm text-gray-500">
                            <FileText className="h-4 w-4 mr-1" />
                            페이지 {question.pageNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">{question.question}</p>
                    </div>
                    <div className="ml-4">
                      {answer.isCorrect || (answer.score && answer.score >= 60) ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-500" />
                      )}
                    </div>
                  </div>

                  {/* 답변 및 정답 */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    {/* 사용자 답변 */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">내 답변:</p>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                        {answer.userAnswer || '(답변하지 않음)'}
                      </p>
                    </div>

                    {/* 정답 (객관식, 단답식) */}
                    {question.type !== QuestionType.ESSAY && question.correctAnswer && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">정답:</p>
                        <p className="text-green-700 bg-green-50 p-3 rounded">
                          {question.correctAnswer}
                        </p>
                      </div>
                    )}

                    {/* 서술형 점수 및 피드백 */}
                    {question.type === QuestionType.ESSAY && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          점수: <span className={getScoreColor(answer.score || 0)}>{answer.score}점</span>
                        </p>
                        {answer.feedback && (
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-medium text-blue-900 mb-1">AI 피드백:</p>
                            <p className="text-blue-800 whitespace-pre-wrap">{answer.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 해설 */}
                    {question.explanation && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">해설:</p>
                        <p className="text-gray-700 bg-blue-50 p-3 rounded whitespace-pre-wrap">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuizResult;
