import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Settings, Play, Loader } from 'lucide-react';
import { generateQuestions } from '../utils/questionGenerator';
import type { Document, QuizSettings as QuizSettingsType } from '../types';

const QuizSettings: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const [multipleChoiceCount, setMultipleChoiceCount] = useState(5);
  const [shortAnswerCount, setShortAnswerCount] = useState(3);
  const [essayCount, setEssayCount] = useState(2);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return;

      try {
        const docRef = doc(db, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDocument({ id: docSnap.id, ...docSnap.data() } as Document);
        } else {
          setError('문서를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('문서 불러오기 실패:', err);
        setError('문서를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const handleGenerateQuiz = async () => {
    if (!document || !currentUser) return;

    try {
      setGenerating(true);
      setError('');

      const settings: QuizSettingsType = {
        multipleChoiceCount,
        shortAnswerCount,
        essayCount,
        totalQuestions: multipleChoiceCount + shortAnswerCount + essayCount,
      };

      // OpenAI로 문제 생성
      const questions = await generateQuestions(
        (document as any).extractedText || '',
        (document as any).pages || [],
        settings
      );

      // Firestore에 퀴즈 저장
      const quizData = {
        userId: currentUser.uid,
        documentId: document.id,
        title: `${document.fileName} - 퀴즈`,
        questions,
        settings,
        createdAt: serverTimestamp(),
      };

      const quizRef = await addDoc(collection(db, 'quizzes'), quizData);

      // 퀴즈 풀이 페이지로 이동
      navigate(`/quiz/take/${quizRef.id}`);
    } catch (err: any) {
      console.error('퀴즈 생성 실패:', err);
      setError(err.message || '퀴즈 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-[#22C7FB]" />
        </div>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || '문서를 찾을 수 없습니다.'}</p>
        </div>
      </Layout>
    );
  }

  const totalQuestions = multipleChoiceCount + shortAnswerCount + essayCount;

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Settings className="h-8 w-8 mr-3 text-[#22C7FB]" />
              퀴즈 설정
            </h1>
            <p className="mt-2 text-gray-600">{document.fileName}</p>
          </div>

          {/* 설정 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              {/* 객관식 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  객관식 문제 수
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={multipleChoiceCount}
                  onChange={(e) => setMultipleChoiceCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C7FB]"
                />
                <p className="mt-1 text-sm text-gray-500">
                  4개의 선택지 중 정답을 고르는 문제
                </p>
              </div>

              {/* 단답식 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  단답식 문제 수
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={shortAnswerCount}
                  onChange={(e) => setShortAnswerCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C7FB]"
                />
                <p className="mt-1 text-sm text-gray-500">
                  짧은 답변을 직접 작성하는 문제
                </p>
              </div>

              {/* 서술형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  서술형 문제 수
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={essayCount}
                  onChange={(e) => setEssayCount(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C7FB]"
                />
                <p className="mt-1 text-sm text-gray-500">
                  깊이 있는 답변이 필요한 문제 (AI 채점)
                </p>
              </div>

              {/* 총 문제 수 */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">총 문제 수</span>
                  <span className="text-2xl font-bold text-[#22C7FB]">{totalQuestions}</span>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => navigate('/')}
                  disabled={generating}
                  className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={handleGenerateQuiz}
                  disabled={totalQuestions === 0 || generating}
                  className="flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#22C7FB] hover:bg-[#1BB0E0] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      퀴즈 생성 및 시작
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 안내 사항 */}
          <div className="mt-6 bg-[#22C7FB]/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-[#0e8fb8]">안내 사항</h3>
            <ul className="mt-2 text-sm text-[#0e8fb8] space-y-1 list-disc list-inside">
              <li>AI가 문서 내용을 분석하여 자동으로 문제를 생성합니다</li>
              <li>생성 시간은 문제 수와 문서 크기에 따라 다를 수 있습니다</li>
              <li>서술형 문제는 AI가 자동으로 채점하고 피드백을 제공합니다</li>
              <li>각 문제에는 해당 내용이 나온 페이지 정보가 표시됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuizSettings;
