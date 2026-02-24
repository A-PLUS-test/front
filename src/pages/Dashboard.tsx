import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SimplePdfViewer from '../components/SimplePdfViewer';
import { FileText, Upload, FileQuestion, Star, BookOpen, Plus } from 'lucide-react';
import type { Document, Folder, QuizSet, VocabularySet } from '../types';
import { fetchDocumentsByUser, fetchFoldersByUser, fetchQuizSetsByUser, fetchVocabularySetsByUser } from '../services/firestore';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([]);
  const [showQuizListModal, setShowQuizListModal] = useState(false);
  const [selectedDocForQuizList, setSelectedDocForQuizList] = useState<Document | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [docs, quizzes, vocabs, userFolders] = await Promise.all([
          fetchDocumentsByUser(currentUser.uid),
          fetchQuizSetsByUser(currentUser.uid),
          fetchVocabularySetsByUser(currentUser.uid),
          fetchFoldersByUser(currentUser.uid),
        ]);

        setDocuments(docs);
        setQuizSets(quizzes);
        setVocabularySets(vocabs);
        setFolders(userFolders);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [currentUser]);

  const recentQuizSets = useMemo(() => quizSets.slice(0, 3), [quizSets]);

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
            {recentQuizSets.length === 0 ? (
              <div className="col-span-3 bg-white rounded-lg p-8 text-center">
                <FileQuestion className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">아직 생성된 퀴즈가 없습니다</p>
              </div>
            ) : (
              recentQuizSets.map((quiz) => (
                <Link
                  key={quiz.id}
                  to={`/quiz/take/${quiz.id}`}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{quiz.title}</h3>
                    {quiz.questions?.length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-[#22C7FB]/20 text-[#0e8fb8] text-xs font-medium rounded">
                        진행중
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{getDocumentName(quiz.documentId)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(quiz.createdAt).toLocaleDateString('ko-KR')}
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
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#22C7FB]"></div>
                <p className="mt-2 text-gray-600">불러오는 중...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">문서가 없습니다</h3>
                <p className="text-sm text-gray-500 mb-4">학습 자료를 업로드하여 시작하세요</p>
                <Link
                  to="/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#22C7FB] hover:bg-[#1BB0E0]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  파일 업로드
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {documents.slice(0, 5).map((doc) => {
                  const docQuizSets = getQuizSetsForDocument(doc.id);
                  const docVocabSets = getVocabularySetsForDocument(doc.id);
                  
                  return (
                  <div
                    key={doc.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => doc.fileType === 'pdf' && handleViewPdf(doc)}
                        className="flex items-center space-x-4 flex-1 text-left"
                      >
                        <div className="w-10 h-10 bg-[#22C7FB]/20 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-[#22C7FB]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-gray-400">
                              {new Date(doc.uploadedAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center space-x-2 ml-4">
                        {doc.fileType === 'pdf' && (
                          <>
                            {docQuizSets.length > 0 ? (
                              <button
                                onClick={() => handleViewQuizzes(doc)}
                                className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200"
                                title="문제 보기"
                              >
                                <FileQuestion className="h-4 w-4 inline mr-1" />
                                문제 보기 ({docQuizSets.length})
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCreateQuiz(doc)}
                                className="px-3 py-1 text-xs font-medium text-[#0e8fb8] bg-[#22C7FB]/10 hover:bg-[#22C7FB]/20 rounded border border-[#22C7FB]/30"
                                title="문제 만들기"
                              >
                                <FileQuestion className="h-4 w-4 inline mr-1" />
                                문제 만들기
                              </button>
                            )}
                            {docVocabSets.length > 0 ? (
                              <button
                                onClick={() => handleViewVocabulary(doc)}
                                className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200"
                                title="단어장 보기"
                              >
                                <BookOpen className="h-4 w-4 inline mr-1" />
                                단어장 보기
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCreateVocabulary(doc)}
                                className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200"
                                title="단어장 만들기"
                              >
                                <BookOpen className="h-4 w-4 inline mr-1" />
                                단어장 만들기
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      </div>

      {showQuizListModal && selectedDocForQuizList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDocForQuizList.fileName}의 문제 목록
              </h3>
              <button
                onClick={() => {
                  setShowQuizListModal(false);
                  setSelectedDocForQuizList(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {getQuizSetsForDocument(selectedDocForQuizList.id).map((quizSet) => (
                <div
                  key={quizSet.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#22C7FB]/50 hover:bg-[#22C7FB]/10 transition-colors cursor-pointer"
                  onClick={() => handleViewQuiz(quizSet.id)}
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
                        handleViewQuiz(quizSet.id);
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
                onClick={() => handleCreateQuiz(selectedDocForQuizList)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#22C7FB] text-white rounded-lg hover:bg-[#1BB0E0] transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>추가 문제 만들기</span>
              </button>
              <button
                onClick={() => {
                  setShowQuizListModal(false);
                  setSelectedDocForQuizList(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
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
