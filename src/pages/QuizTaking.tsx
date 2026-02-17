import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { ChevronLeft, ChevronRight, Check, FileText, Loader, Save } from 'lucide-react';
import type { QuizSet, Answer } from '../types';
import { QuestionType } from '../types';
import { gradeEssayAnswer } from '../utils/questionGenerator';

const QuizTaking: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizSet | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  // 퀴즈 및 진행 상태 불러오기
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !currentUser) return;

      try {
        const quizRef = doc(db, 'quizzes', quizId);
        const quizSnap = await getDoc(quizRef);

        if (quizSnap.exists()) {
          setQuiz({ id: quizSnap.id, ...quizSnap.data() } as QuizSet);
          
          // 저장된 진행 상태 불러오기
          const progressRef = doc(db, 'quizProgress', `${currentUser.uid}_${quizId}`);
          const progressSnap = await getDoc(progressRef);
          
          if (progressSnap.exists()) {
            const progressData = progressSnap.data();
            setAnswers(progressData.answers || {});
            setCurrentQuestionIndex(progressData.currentQuestionIndex || 0);
          }
        }
      } catch (err) {
        console.error('퀴즈 불러오기 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, currentUser]);

  // 답변 변경 시 자동 저장
  useEffect(() => {
    const autoSave = async () => {
      if (!quizId || !currentUser || !quiz) return;

      setAutoSaving(true);
      try {
        const progressRef = doc(db, 'quizProgress', `${currentUser.uid}_${quizId}`);
        await setDoc(progressRef, {
          quizId,
          userId: currentUser.uid,
          answers,
          currentQuestionIndex,
          lastSaved: serverTimestamp(),
        });
      } catch (error) {
        console.error('자동 저장 실패:', error);
      } finally {
        setAutoSaving(false);
      }
    };

    // 답변이 변경되면 1초 후 자동 저장
    const timer = setTimeout(autoSave, 1000);
    return () => clearTimeout(timer);
  }, [answers, currentQuestionIndex, quizId, currentUser, quiz]);

  if (loading || !quiz) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  const handleAnswerChange = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = async () => {
    if (!currentUser) return;

    // 모든 문제에 답했는지 확인
    const unansweredCount = quiz.questions.filter(q => !answers[q.id]).length;
    if (unansweredCount > 0) {
      const confirm = window.confirm(
        `${unansweredCount}개의 문제에 답하지 않았습니다. 제출하시겠습니까?`
      );
      if (!confirm) return;
    }

    try {
      setSubmitting(true);

      // 채점 진행
      const gradedAnswers: Answer[] = [];
      let totalScore = 0;

      for (const question of quiz.questions) {
        const userAnswer = answers[question.id] || '';
        let isCorrect = false;
        let score = 0;
        let feedback = '';

        if (question.type === QuestionType.MULTIPLE_CHOICE) {
          isCorrect = userAnswer === question.correctAnswer;
          score = isCorrect ? 100 : 0;
          totalScore += score;
        } else if (question.type === QuestionType.SHORT_ANSWER) {
          // 단답식은 정답과 정확히 일치하는지 확인 (대소문자 무시)
          isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim();
          score = isCorrect ? 100 : 0;
          totalScore += score;
        } else if (question.type === QuestionType.ESSAY) {
          // 서술형은 AI로 채점
          try {
            const grading = await gradeEssayAnswer(
              question.question,
              userAnswer,
              question.explanation || ''
            );
            score = grading.score;
            feedback = grading.feedback;
            totalScore += score;
          } catch (error) {
            console.error('서술형 채점 실패:', error);
            score = 0;
            feedback = '채점에 실패했습니다.';
          }
        }

        gradedAnswers.push({
          questionId: question.id,
          userAnswer,
          isCorrect,
          score,
          feedback,
        });
      }

      const averageScore = Math.round(totalScore / quiz.questions.length);

      // 결과 저장
      const resultData = {
        userId: currentUser.uid,
        quizSetId: quiz.id,
        answers: gradedAnswers,
        score: averageScore,
        totalQuestions: quiz.questions.length,
        completedAt: serverTimestamp(),
      };

      const resultRef = await addDoc(collection(db, 'quizResults'), resultData);

      // 결과 페이지로 이동
      navigate(`/quiz/result/${resultRef.id}`);
    } catch (err) {
      console.error('제출 실패:', err);
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)]">
        {/* 사이드바 - 문제 네비게이션 */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">문제 목록</h3>
            {autoSaving && (
              <div className="flex items-center text-xs text-gray-500">
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                저장중
              </div>
            )}
            {!autoSaving && Object.keys(answers).length > 0 && (
              <div className="flex items-center text-xs text-green-600">
                <Save className="h-3 w-3 mr-1" />
                저장됨
              </div>
            )}
          </div>
          <div className="space-y-2">
            {quiz.questions.map((question, index) => {
              const isAnswered = !!answers[question.id];
              const isCurrent = index === currentQuestionIndex;

              return (
                <button
                  key={question.id}
                  onClick={() => handleQuestionSelect(index)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isAnswered
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>문제 {index + 1}</span>
                    {isAnswered && !isCurrent && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    {question.type === QuestionType.MULTIPLE_CHOICE && '객관식'}
                    {question.type === QuestionType.SHORT_ANSWER && '단답식'}
                    {question.type === QuestionType.ESSAY && '서술형'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 진행률 */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">
              진행률: {Object.keys(answers).length} / {totalQuestions}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${(Object.keys(answers).length / totalQuestions) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 - 현재 문제 */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            {/* 문제 헤더 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  문제 {currentQuestionIndex + 1}
                </h2>
                <span className="text-sm text-gray-500">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && '객관식'}
                  {currentQuestion.type === QuestionType.SHORT_ANSWER && '단답식'}
                  {currentQuestion.type === QuestionType.ESSAY && '서술형'}
                </span>
                {currentQuestion.pageNumber && (
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    페이지 {currentQuestion.pageNumber}
                  </span>
                )}
              </div>
            </div>

            {/* 문제 내용 */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <p className="text-lg text-gray-900 whitespace-pre-wrap mb-6">
                {currentQuestion.question}
              </p>

              {/* 객관식 선택지 */}
              {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion.id] === option
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={answers[currentQuestion.id] === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        className="mt-1 h-4 w-4 text-blue-600"
                      />
                      <span className="ml-3 text-gray-900">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* 단답식 입력 */}
              {currentQuestion.type === QuestionType.SHORT_ANSWER && (
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="답변을 입력하세요"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {/* 서술형 입력 */}
              {currentQuestion.type === QuestionType.ESSAY && (
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="답변을 작성하세요 (AI가 채점합니다)"
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </button>

              {currentQuestionIndex === totalQuestions - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      제출 중...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      제출하기
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  다음
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuizTaking;
