import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { EmptyState, PageLoading } from '../components/common/PageState';
import SimplePdfViewer from '../components/SimplePdfViewer';
import DocumentListItem from '../components/documents/DocumentListItem';
import DocumentLearningActions from '../components/documents/DocumentLearningActions';
import QuizSetListModal from '../components/quiz/QuizSetListModal';
import { FileText, Upload, FileQuestion, Star } from 'lucide-react';
import type { Document, Folder, QuizSet, VocabularySet } from '../types';

interface SavedQuiz {
  id: string;
  documentId: string;
  title: string;
  questionsCount: number;
  createdAt: any;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([]);
  const [showQuizListModal, setShowQuizListModal] = useState(false);
  const [selectedDocForQuizList, setSelectedDocForQuizList] = useState<Document | null>(null);

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

        // 폴더 불러오기
        const foldersQuery = query(
          collection(db, 'folders'),
          where('userId', '==', currentUser.uid)
        );
        const foldersSnapshot = await getDocs(foldersQuery);
        const fetchedFolders: Folder[] = [];
        foldersSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isDeleted !== true) {
            fetchedFolders.push({
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
            } as Folder);
          }
        });
        setFolders(fetchedFolders);

        // 퀴즈 세트 가져오기
        const quizSetsQuery = query(
          collection(db, 'quizzes'),
          where('userId', '==', currentUser.uid)
        );
        const quizSetsSnapshot = await getDocs(quizSetsQuery);
        const fetchedQuizSets: QuizSet[] = [];
        quizSetsSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedQuizSets.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          } as QuizSet);
        });
        setQuizSets(fetchedQuizSets);

        // 단어장 세트 가져오기
        const vocabQuery = query(
          collection(db, 'vocabularySets'),
          where('userId', '==', currentUser.uid)
        );
        const vocabSnapshot = await getDocs(vocabQuery);
        const fetchedVocabSets: VocabularySet[] = [];
        vocabSnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedVocabSets.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
          } as VocabularySet);
        });
        setVocabularySets(fetchedVocabSets);

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

  const getQuizSetsForDocument = (documentId: string) => {
    return quizSets.filter(quiz => quiz.documentId === documentId);
  };

  const getVocabularySetsForDocument = (documentId: string) => {
    return vocabularySets.filter(vocab => vocab.documentId === documentId);
  };

  const handleCreateQuiz = (doc: Document) => {
    navigate(`/quiz/settings/${doc.id}`);
  };

  const handleCreateVocabulary = (doc: Document) => {
    navigate(`/vocabulary/${doc.id}`);
  };

  const handleViewQuizzes = (doc: Document) => {
    setSelectedDocForQuizList(doc);
    setShowQuizListModal(true);
  };

  const handleViewVocabulary = (doc: Document) => {
    const vocabSets = getVocabularySetsForDocument(doc.id);
    if (vocabSets.length > 0) {
      navigate(`/vocabulary/${doc.id}`);
    }
  };

  const handleViewQuiz = (quizSetId: string) => {
    navigate(`/quiz/take/${quizSetId}`);
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">내 학습 현황</h1>
          <p className="mt-2 text-gray-600">{currentUser?.email}</p>
        </div>

        {/* 학습 진행 상황 카드 제거, 즐겨찾기 폴더로 대체 */}
        {folders.filter(f => f.isFavorite).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">즐겨찾기 폴더</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {folders
                .filter(f => f.isFavorite)
                .map((folder) => (
                  <Link
                    key={folder.id}
                    to={`/folder/${folder.id}`}
                    className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{folder.name}</h3>
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {documents.filter(d => d.folderId === folder.id).length}개 파일
                    </p>
                  </Link>
                ))}
            </div>
          </div>
        )}

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
                      <span className="ml-2 px-2 py-1 bg-[#22C7FB]/20 text-[#0e8fb8] text-xs font-medium rounded">
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
              <PageLoading />
            ) : documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="문서가 없습니다"
                description="학습 자료를 업로드하여 시작하세요"
                action={
                  <Link
                    to="/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#22C7FB] hover:bg-[#1BB0E0]"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    파일 업로드
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-gray-200">
                {documents.slice(0, 5).map((doc) => {
                  const docQuizSets = getQuizSetsForDocument(doc.id);
                  const docVocabSets = getVocabularySetsForDocument(doc.id);
                  
                  return (
                  <DocumentListItem
                    key={doc.id}
                    document={doc}
                    onOpen={() => doc.fileType === 'pdf' && handleViewPdf(doc)}
                    actions={
                      doc.fileType === 'pdf' ? (
                        <DocumentLearningActions
                          quizSetCount={docQuizSets.length}
                          vocabularySetCount={docVocabSets.length}
                          isKoreanDocument={doc.language !== 'en'}
                          onViewQuizzes={() => handleViewQuizzes(doc)}
                          onCreateQuiz={() => handleCreateQuiz(doc)}
                          onViewVocabulary={() => handleViewVocabulary(doc)}
                          onCreateVocabulary={() => handleCreateVocabulary(doc)}
                        />
                      ) : null
                    }
                  />
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuizListModal && selectedDocForQuizList && (
        <QuizSetListModal
          document={selectedDocForQuizList}
          quizSets={getQuizSetsForDocument(selectedDocForQuizList.id)}
          onClose={() => {
            setShowQuizListModal(false);
            setSelectedDocForQuizList(null);
          }}
          onViewQuiz={handleViewQuiz}
          onCreateQuiz={handleCreateQuiz}
        />
      )}

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
