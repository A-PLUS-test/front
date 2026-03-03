import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SimplePdfViewer from '../components/SimplePdfViewer';
import { EmptyState, PageLoading } from '../components/common/PageState';
import DocumentLearningActions from '../components/documents/DocumentLearningActions';
import FolderActionCards from '../components/documents/FolderActionCards';
import MoveFileModal from '../components/documents/MoveFileModal';
import CombinedQuizSection from '../components/quiz/CombinedQuizSection';
import QuizSetListModal from '../components/quiz/QuizSetListModal';
import { 
  Upload, 
  FileText, 
  // AlertCircle, // TODO: 오답 보기 기능 구현 시 사용
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

        <FolderActionCards
          onUpload={() => navigate('/upload?folderId=default')}
          onVocabularyAction={() => {
            if (documents.filter(d => d.language === 'en').length > 0) {
              navigate('/folder/default/vocabulary');
            }
          }}
          canOpenVocabulary={documents.filter(d => d.language === 'en').length > 0}
        />

        <CombinedQuizSection
          quizSets={getCombinedQuizSetsForFolder()}
          onViewQuiz={handleViewQuiz}
          onDeleteQuiz={deleteCombinedQuiz}
        />

        {/* 파일 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">파일 목록</h2>
          </div>

          {loading ? (
            <PageLoading />
          ) : documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="파일이 없습니다"
              description="학습 자료를 업로드하여 시작하세요"
              action={
                <button
                  onClick={() => navigate('/upload?folderId=default')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#22C7FB] hover:bg-[#1BB0E0]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  파일 업로드
                </button>
              }
            />
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
                        className="flex-1 px-2 py-1 border border-[#22C7FB] rounded focus:outline-none"
                        autoFocus
                      />
                    </div>
                  ) : (
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
                          <DocumentLearningActions
                            quizSetCount={docQuizSets.length}
                            vocabularySetCount={docVocabSets.length}
                            isKoreanDocument={doc.language !== 'en'}
                            onViewQuizzes={() => handleViewQuizzes(doc)}
                            onCreateQuiz={() => handleCreateQuiz(doc)}
                            onViewVocabulary={() => handleViewVocabulary(doc)}
                            onCreateVocabulary={() => handleCreateVocabulary(doc)}
                            className="flex items-center space-x-2"
                          />
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

      {showMoveModal && movingFile && (
        <MoveFileModal
          movingFile={movingFile}
          folders={folders}
          onMove={moveFile}
          onClose={() => {
            setShowMoveModal(false);
            setMovingFile(null);
          }}
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

export default DefaultFolderView;
