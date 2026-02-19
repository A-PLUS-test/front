import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SimplePdfViewer from '../components/SimplePdfViewer';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  BookOpen,
  FileQuestion,
  Plus,
  Edit2,
  Trash2,
  FolderInput
} from 'lucide-react';
import type { Document, QuizSet, VocabularySet } from '../types';

const DefaultFolderView: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([]);
  const [showQuizListModal, setShowQuizListModal] = useState(false);
  const [selectedDocForQuizList, setSelectedDocForQuizList] = useState<Document | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const [movingFile, setMovingFile] = useState<{ id: string; currentFolderId?: string } | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [folders, setFolders] = useState<import('../types').Folder[]>([]);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // 폴더 목록 가져오기
      const foldersQuery = query(
        collection(db, 'folders'),
        where('userId', '==', currentUser.uid)
      );
      const foldersSnapshot = await getDocs(foldersQuery);
      const fetchedFolders: import('../types').Folder[] = [];
      foldersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isDeleted !== true) {
          fetchedFolders.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          } as import('../types').Folder);
        }
      });
      setFolders(fetchedFolders);

      // 무제 폴더의 문서 불러오기 (folderId가 없거나 'default'인 것)
      const docsQuery = query(
        collection(db, 'documents'),
        where('userId', '==', currentUser.uid)
      );
      const docsSnapshot = await getDocs(docsQuery);
      const fetchedDocs: Document[] = [];
      
      docsSnapshot.forEach((doc) => {
        const data = doc.data();
        const docFolderId = data.folderId || 'default';
        
        if (docFolderId === 'default' && data.isDeleted !== true) {
          fetchedDocs.push({
            id: doc.id,
            ...data,
            uploadedAt: data.uploadedAt?.toDate?.() || new Date(),
          } as Document);
        }
      });

      setDocuments(fetchedDocs);

      // 퀴즈 세트 가져오기
      const quizQuery = query(
        collection(db, 'quizzes'),
        where('userId', '==', currentUser.uid)
      );
      const quizSnapshot = await getDocs(quizQuery);
      const fetchedQuizSets: QuizSet[] = [];
      quizSnapshot.forEach((doc) => {
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
    navigate(`/vocabulary/${doc.id}`);
  };

  const handleViewQuiz = (quizSetId: string) => {
    navigate(`/quiz/take/${quizSetId}`);
  };

  const getCombinedQuizSetsForFolder = () => {
    return quizSets.filter(quiz => 
      quiz.documentId === 'default' && 
      quiz.isCombined === true
    );
  };

  const deleteCombinedQuiz = async (quizId: string, quizTitle: string) => {
    if (!window.confirm(`"${quizTitle}" 혼합 문제를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const quizRef = doc(db, 'quizzes', quizId);
      await deleteDoc(quizRef);
      
      alert('혼합 문제가 삭제되었습니다.');
      fetchData(); // 데이터 새로고침
    } catch (error) {
      console.error('혼합 문제 삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const renameItem = async () => {
    if (!editingItem || !editingItem.name.trim()) return;

    try {
      const docRef = doc(db, 'documents', editingItem.id);
      await updateDoc(docRef, {
        fileName: editingItem.name.trim(),
        updatedAt: serverTimestamp(),
      });
      
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('이름 변경 실패:', error);
    }
  };

  const deleteItem = async (id: string) => {
    if (!window.confirm('이 파일을 휴지통으로 이동하시겠습니까?')) {
      return;
    }

    try {
      await updateDoc(doc(db, 'documents', id), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });
      
      fetchData();
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const moveFile = async (targetFolderId?: string) => {
    if (!movingFile) return;

    try {
      const docRef = doc(db, 'documents', movingFile.id);
      await updateDoc(docRef, {
        folderId: targetFolderId || null,
        updatedAt: serverTimestamp(),
      });
      
      setShowMoveModal(false);
      setMovingFile(null);
      fetchData();
    } catch (error) {
      console.error('파일 이동 실패:', error);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link to="/documents" className="hover:text-gray-700">자료</Link>
            <span>/</span>
            <span className="text-gray-900">기본 폴더</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">기본 폴더</h1>
          <p className="mt-2 text-gray-600">{documents.length}개의 파일</p>
        </div>

        {/* 액션 버튼들 (전체 문제 만들기 제외) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate('/upload?folderId=default')}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left"
          >
            <Upload className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="font-semibold text-gray-900">파일 업로드</h3>
            <p className="text-sm text-gray-600 mt-1">새 자료 추가하기</p>
          </button>

          <button
            onClick={() => {
              if (documents.filter(d => d.language === 'en').length > 0) {
                navigate('/folder/default/vocabulary');
              }
            }}
            disabled={documents.filter(d => d.language === 'en').length === 0}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <BookOpen className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-900">단어장 보기</h3>
            <p className="text-sm text-gray-600 mt-1">영어 문서 단어 학습</p>
          </button>

          <button
            disabled={true}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertCircle className="h-8 w-8 text-orange-600 mb-3" />
            <h3 className="font-semibold text-gray-900">오답 보기</h3>
            <p className="text-sm text-gray-600 mt-1">틀린 문제 복습하기</p>
          </button>
        </div>

        {/* 혼합 문제 목록 */}
        {getCombinedQuizSetsForFolder().length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">혼합 문제</h2>
              <p className="text-sm text-gray-600 mt-1">여러 PDF에서 생성된 혼합 문제</p>
            </div>
            <div className="divide-y divide-gray-200">
              {getCombinedQuizSetsForFolder().map((quizSet) => (
                <div
                  key={quizSet.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleViewQuiz(quizSet.id)}
                    >
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
                          deleteCombinedQuiz(quizSet.id, quizSet.title);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewQuiz(quizSet.id);
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
        )}

        {/* 파일 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">파일 목록</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">불러오는 중...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">파일이 없습니다</h3>
              <p className="text-sm text-gray-500 mb-4">학습 자료를 업로드하여 시작하세요</p>
              <button
                onClick={() => navigate('/upload?folderId=default')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                파일 업로드
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {documents.map((doc) => {
                const docQuizSets = getQuizSetsForDocument(doc.id);
                const docVocabSets = getVocabularySetsForDocument(doc.id);
                
                return (
                <div
                  key={doc.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  {editingItem?.id === doc.id ? (
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && renameItem()}
                        onBlur={renameItem}
                        className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => doc.fileType === 'pdf' && handleViewPdf(doc)}
                        className="flex items-center space-x-4 flex-1 text-left"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs text-gray-500 uppercase">{doc.fileType}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(doc.uploadedAt).toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingFile({ id: doc.id, currentFolderId: doc.folderId });
                            setShowMoveModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          title="이동"
                        >
                          <FolderInput className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingItem({ id: doc.id, name: doc.fileName });
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                          title="이름 변경"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(doc.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
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
                  )}
                </div>
              )})}
            </div>
          )}
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
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => handleViewQuiz(quizSet.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <FileQuestion className="h-5 w-5 text-blue-600" />
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
                      className="ml-4 px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
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
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {showMoveModal && movingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">파일 이동</h3>
            <p className="text-sm text-gray-600 mb-4">이동할 폴더를 선택하세요</p>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => moveFile(undefined)}
                disabled={!movingFile.currentFolderId}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                  !movingFile.currentFolderId
                    ? 'border-blue-500 bg-blue-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">기본 폴더</span>
                  {!movingFile.currentFolderId && (
                    <span className="text-xs text-gray-500">(현재 위치)</span>
                  )}
                </div>
              </button>
              
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => moveFile(folder.id)}
                  disabled={movingFile.currentFolderId === folder.id}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    movingFile.currentFolderId === folder.id
                      ? 'border-blue-500 bg-blue-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">{folder.name}</span>
                    {movingFile.currentFolderId === folder.id && (
                      <span className="text-xs text-gray-500">(현재 위치)</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setMovingFile(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                취소
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

export default DefaultFolderView;
