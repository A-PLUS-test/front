import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SimplePdfViewer from '../components/SimplePdfViewer';
import { FileText, Upload, BookOpen, Clock, PlayCircle, CheckCircle, FileQuestion, Eye } from 'lucide-react';
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
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);

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
          if (data.isDeleted !== true) {
            docs.push({ 
              id: doc.id, 
              ...data,
              uploadedAt: data.uploadedAt?.toDate?.() || new Date(),
            } as Document);
          }
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

  const handleViewPdf = (doc: Document) => {
    if (doc.fileType === 'pdf') {
      setSelectedPdf({ url: doc.fileUrl, name: doc.fileName });
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">내 학습 현황</h1>
          <p className="mt-2 text-gray-600">{currentUser?.email}</p>
        </div>

        {/* 학습 진행 상황 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">진행중</div>
              <div className="text-3xl font-bold text-blue-600">{savedQuizzes.length}/10</div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">진행중</div>
              <div className="text-3xl font-bold text-blue-600">0/10</div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">진행중</div>
              <div className="text-3xl font-bold text-blue-600">0/10</div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">진행중</div>
              <div className="text-3xl font-bold text-blue-600">0/10</div>
            </div>
          </div>
        </div>

        {/* 최근에 본 퀴즈 섹션 */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">최근에 본 퀴즈</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {savedQuizzes.length === 0 ? (
              <div className="col-span-3 bg-white rounded-lg p-8 text-center">
                <FileQuestion className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">아직 생성된 퀴즈가 없습니다</p>
              </div>
            ) : (
              savedQuizzes.slice(0, 3).map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/quiz/take/${quiz.id}`}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{quiz.title}</h3>
                    {quiz.questionsCount > 0 && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        진행중
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{getDocumentName(quiz.documentId)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date().toLocaleDateString('ko-KR')}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 최근 문서 섹션 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">최근 문서</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">불러오는 중...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">문서가 없습니다</h3>
                <p className="text-sm text-gray-500 mb-4">학습 자료를 업로드하여 시작하세요</p>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  파일 업로드
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {documents.slice(0, 5).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => doc.fileType === 'pdf' && handleViewPdf(doc)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-gray-500">
                              퀴즈 2개 • 핵심단어 30개
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(doc.uploadedAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.fileType === 'pdf' && (
                          <div className="p-2 text-gray-400">
                            <Eye className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPdf && (
        <SimplePdfViewer
          fileUrl={selectedPdf.url}
          fileName={selectedPdf.name}
          onClose={() => setSelectedPdf(null)}
        />
      )}
    </Layout>
  );
};

export default Dashboard;
