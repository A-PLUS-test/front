import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { FileText, Upload, BookOpen, Clock, PlayCircle, CheckCircle, FileQuestion } from 'lucide-react';
import type { Document } from '../types';

interface SavedQuiz {
  id: string;
  documentId: string;
  title: string;
  questionsCount: number;
  createdAt: any;
}

interface QuizResult {
  id: string;
  quizSetId: string;
  score: number;
  totalQuestions: number;
  completedAt: any;
}

interface VocabSet {
  id: string;
  documentId: string;
  title: string;
  wordsCount: number;
  createdAt: any;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [vocabSets, setVocabSets] = useState<VocabSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!currentUser) return;

      try {
        // 문서 불러오기
        const docsQuery = query(
          collection(db, 'documents'),
          where('userId', '==', currentUser.uid)
        );
        const docsSnapshot = await getDocs(docsQuery);
        const docs: Document[] = [];
        docsSnapshot.forEach((doc) => {
          const data = doc.data();
          docs.push({ 
            id: doc.id, 
            ...data,
            uploadedAt: data.uploadedAt?.toDate?.() || new Date(),
          } as Document);
        });
        docs.sort((a, b) => {
          const dateA = a.uploadedAt instanceof Date ? a.uploadedAt : new Date(a.uploadedAt);
          const dateB = b.uploadedAt instanceof Date ? b.uploadedAt : new Date(b.uploadedAt);
          return dateB.getTime() - dateA.getTime();
        });
        setDocuments(docs);

        // 저장된 퀴즈 불러오기
        const quizzesQuery = query(
          collection(db, 'quizzes'),
          where('userId', '==', currentUser.uid)
        );
        const quizzesSnapshot = await getDocs(quizzesQuery);
        const quizzes: SavedQuiz[] = [];
        quizzesSnapshot.forEach((doc) => {
          const data = doc.data();
          quizzes.push({
            id: doc.id,
            documentId: data.documentId,
            title: data.title,
            questionsCount: data.questions?.length || 0,
            createdAt: data.createdAt,
          });
        });
        setSavedQuizzes(quizzes);

        // 퀴즈 결과 불러오기
        const resultsQuery = query(
          collection(db, 'quizResults'),
          where('userId', '==', currentUser.uid)
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const results: QuizResult[] = [];
        resultsSnapshot.forEach((doc) => {
          const data = doc.data();
          results.push({
            id: doc.id,
            quizSetId: data.quizSetId,
            score: data.score,
            totalQuestions: data.totalQuestions,
            completedAt: data.completedAt,
          });
        });
        setQuizResults(results);

        // 단어장 불러오기
        const vocabQuery = query(
          collection(db, 'vocabularySets'),
          where('userId', '==', currentUser.uid)
        );
        const vocabSnapshot = await getDocs(vocabQuery);
        const vocabs: VocabSet[] = [];
        vocabSnapshot.forEach((doc) => {
          const data = doc.data();
          vocabs.push({
            id: doc.id,
            documentId: data.documentId,
            title: data.title,
            wordsCount: data.words?.length || 0,
            createdAt: data.createdAt,
          });
        });
        setVocabSets(vocabs);

      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [currentUser]);

  const getDocumentName = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    return doc?.fileName || '알 수 없음';
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="mt-2 text-gray-600">업로드한 자료로 문제를 만들고 학습하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link
            to="/upload"
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">파일 업로드</h3>
                <p className="mt-1 text-sm text-gray-600">새 자료 추가</p>
              </div>
              <Upload className="h-10 w-10 text-blue-600" />
            </div>
          </Link>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">총 문서</h3>
                <p className="mt-1 text-3xl font-bold text-blue-600">{documents.length}</p>
              </div>
              <FileText className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">저장된 퀴즈</h3>
                <p className="mt-1 text-3xl font-bold text-green-600">{savedQuizzes.length}</p>
              </div>
              <FileQuestion className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">완료한 퀴즈</h3>
                <p className="mt-1 text-3xl font-bold text-purple-600">{quizResults.length}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* 저장된 퀴즈 목록 */}
        {savedQuizzes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">저장된 퀴즈</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {savedQuizzes.slice(0, 5).map((quiz) => (
                <div key={quiz.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{quiz.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {quiz.questionsCount}문제 • {getDocumentName(quiz.documentId)}
                    </p>
                  </div>
                  <Link
                    to={`/quiz/take/${quiz.id}`}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlayCircle className="h-4 w-4 mr-1" />
                    시작하기
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 최근 퀴즈 결과 */}
        {quizResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">최근 결과</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {quizResults.slice(0, 5).map((result) => (
                <Link
                  key={result.id}
                  to={`/quiz/result/${result.id}`}
                  className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between block"
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">퀴즈 결과</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {result.totalQuestions}문제 중 {Math.round((result.score / 100) * result.totalQuestions)}문제 정답
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${
                    result.score >= 80 ? 'text-green-600' : 
                    result.score >= 60 ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {result.score}점
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 단어장 목록 */}
        {vocabSets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">저장된 단어장</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {vocabSets.slice(0, 5).map((vocab) => (
                <Link
                  key={vocab.id}
                  to={`/vocabulary/${vocab.documentId}`}
                  className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between block"
                >
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{vocab.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {vocab.wordsCount}개 단어 • {getDocumentName(vocab.documentId)}
                    </p>
                  </div>
                  <BookOpen className="h-6 w-6 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 내 문서 리스트 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">내 문서</h2>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">불러오는 중...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">문서가 없습니다</h3>
              <p className="mt-1 text-sm text-gray-500">
                학습 자료를 업로드하여 시작하세요
              </p>
              <div className="mt-6">
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  파일 업로드
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-10 w-10 text-blue-600" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{doc.fileName}</h3>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(doc.uploadedAt).toLocaleDateString('ko-KR')}
                          </span>
                          <span className="uppercase">{doc.fileType}</span>
                          {doc.isProcessed ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              처리 완료
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              처리 중
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {doc.isProcessed && (
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/quiz/settings/${doc.id}`}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          문제 만들기
                        </Link>
                        {doc.language === 'en' && (
                          <Link
                            to={`/vocabulary/${doc.id}`}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            단어 학습
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
