import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
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
  Plus,
  Edit2,
  Trash2,
  FolderInput
} from 'lucide-react';
import type { Document, Folder, QuizSet, VocabularySet } from '../types';

const FolderView: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizSettings, setQuizSettings] = useState<{ [key: string]: number }>({});
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([]);
  const [showQuizListModal, setShowQuizListModal] = useState(false);
  const [selectedDocForQuizList, setSelectedDocForQuizList] = useState<Document | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);
  const [movingFile, setMovingFile] = useState<{ id: string; currentFolderId?: string } | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [bottomHintMessage, setBottomHintMessage] = useState<string | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [folderId, currentUser]);

  useEffect(() => {
    return () => {
      if (hintTimeoutRef.current) {
        window.clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      // 모든 폴더 정보 불러오기
      const folderQuery = query(
        collection(db, 'folders'),
        where('userId', '==', currentUser.uid)
      );
      const folderSnapshot = await getDocs(folderQuery);
      const fetchedFolders: Folder[] = [];
      folderSnapshot.forEach((doc) => {
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

      // 현재 폴더 정보 설정 (default가 아닌 경우)
      if (folderId !== 'default') {
        const foundFolder = folderSnapshot.docs.find(doc => doc.id === folderId);
        
        if (foundFolder) {
          const data = foundFolder.data();
          setFolder({
            id: foundFolder.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          } as Folder);
        }
      }

      // 문서 불러오기
      const docsQuery = query(
        collection(db, 'documents'),
        where('userId', '==', currentUser.uid)
      );
      const docsSnapshot = await getDocs(docsQuery);
      const fetchedDocs: Document[] = [];
      
      docsSnapshot.forEach((doc) => {
        const data = doc.data();
        const docFolderId = data.folderId || 'default';
        
        if (docFolderId === folderId && data.isDeleted !== true) {
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
      quiz.documentId === folderId && 
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

  const createCombinedQuiz = async () => {
    if (!currentUser || Object.keys(quizSettings).length === 0) return;

    try {
      setGenerating(true);
      const questions: any[] = [];
      const sourceDocuments: { documentId: string; fileName: string; questionCount: number }[] = [];
      
      // 각 문서별로 기존 문제 가져오기
      for (const [docId, questionCount] of Object.entries(quizSettings)) {
        if (questionCount > 0) {
          const document = documents.find(d => d.id === docId);
          if (!document) continue;

          // 해당 문서의 퀴즈 세트 찾기
          const docQuizSets = getQuizSetsForDocument(docId);
          
          if (docQuizSets.length === 0) {
            alert(`${document.fileName}에는 생성된 문제가 없습니다. 먼저 개별 문제를 만들어주세요.`);
            setGenerating(false);
            return;
          }

          // 모든 퀴즈 세트에서 문제 수집
          const allQuestionsFromDoc: any[] = [];
          docQuizSets.forEach(quizSet => {
            quizSet.questions.forEach(q => {
              allQuestionsFromDoc.push({
                ...q,
                documentId: docId,
                documentName: document.fileName,
              });
            });
          });

          // 요청된 개수만큼 랜덤하게 선택
          const selectedQuestions = [];
          const availableCount = Math.min(questionCount, allQuestionsFromDoc.length);
          
          // 랜덤하게 섞기
          const shuffled = [...allQuestionsFromDoc].sort(() => Math.random() - 0.5);
          
          for (let i = 0; i < availableCount; i++) {
            selectedQuestions.push({
              ...shuffled[i],
              id: `combined_${docId}_${Date.now()}_${i}`, // 새 ID 생성
            });
          }

          questions.push(...selectedQuestions);

          sourceDocuments.push({
            documentId: docId,
            fileName: document.fileName,
            questionCount: availableCount,
          });
        }
      }

      // 문제가 하나도 없으면 경고
      if (questions.length === 0) {
        alert('선택한 문서에서 문제를 가져올 수 없습니다.');
        setGenerating(false);
        return;
      }

      // 전체 문제를 랜덤하게 섞기
      const shuffledQuestions = questions.sort(() => Math.random() - 0.5);

      // 문제 타입별로 카운트
      const multipleChoiceCount = shuffledQuestions.filter(q => q.type === 'multiple_choice').length;
      const shortAnswerCount = shuffledQuestions.filter(q => q.type === 'short_answer').length;
      const essayCount = shuffledQuestions.filter(q => q.type === 'essay').length;

      // 퀴즈 세트 생성
      const quizTitle = folder?.name || '기본 폴더';
      const quizRef = await addDoc(collection(db, 'quizzes'), {
        userId: currentUser.uid,
        documentId: folderId || 'default',
        title: `${quizTitle} - 혼합 문제`,
        questions: shuffledQuestions,
        createdAt: serverTimestamp(),
        isCombined: true,
        sourceDocuments: sourceDocuments,
        settings: {
          multipleChoiceCount,
          shortAnswerCount,
          essayCount,
          totalQuestions: shuffledQuestions.length,
        },
      });

      setShowQuizModal(false);
      setQuizSettings({});
      
      // 생성된 퀴즈로 이동
      navigate(`/quiz/take/${quizRef.id}`);
    } catch (error) {
      console.error('퀴즈 생성 실패:', error);
      alert('퀴즈 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const folderName = folder?.name || '무제 폴더';
  const availableQuizSetCount = documents.filter((doc) => getQuizSetsForDocument(doc.id).length > 0).length;
  const canCreateCombinedQuiz = availableQuizSetCount >= 2;
  const pdfDocumentCount = documents.filter((doc) => doc.fileType === 'pdf').length;
  const englishPdfCount = documents.filter((doc) => doc.fileType === 'pdf' && doc.language === 'en').length;
  const canOpenVocabulary = englishPdfCount > 0;

  const showBottomHint = (message: string) => {
    setBottomHintMessage(message);

    if (hintTimeoutRef.current) {
      window.clearTimeout(hintTimeoutRef.current);
    }

    hintTimeoutRef.current = window.setTimeout(() => {
      setBottomHintMessage(null);
      hintTimeoutRef.current = null;
    }, 3000);
  };

  const handleCombinedQuizAction = () => {
    if (canCreateCombinedQuiz) {
      setShowQuizModal(true);
      return;
    }

    showBottomHint('문제 세트를 2개 이상 만들어주세요');
  };

  const handleVocabularyAction = () => {
    if (canOpenVocabulary) {
      navigate(`/folder/${folderId}/vocabulary`);
      return;
    }

    if (pdfDocumentCount === 0) {
      showBottomHint('생성된 단어장이 없습니다');
      return;
    }

    showBottomHint('영어 자료에서만 단어 생성이 가능해요');
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link to="/documents" className="hover:text-gray-700">자료</Link>
            <span>/</span>
            <span className="text-gray-900">{folderName}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{folderName}</h1>
          <p className="mt-2 text-gray-600">{documents.length}개의 파일</p>
        </div>

        <FolderActionCards
          onUpload={() => navigate(`/upload?folderId=${folderId}`)}
          onCombinedQuizAction={handleCombinedQuizAction}
          canCreateCombinedQuiz={canCreateCombinedQuiz}
          onVocabularyAction={handleVocabularyAction}
          canOpenVocabulary={canOpenVocabulary}
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
                  onClick={() => navigate(`/upload?folderId=${folderId}`)}
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
                            onVocabularyBlocked={() => showBottomHint('한글 샘플은 단어장을 만들 수 없습니다.')}
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

      {/* 전체 문제 만들기 모달 */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">전체 문제 만들기</h3>
            <p className="text-sm text-gray-600 mb-6">
              각 PDF에서 생성할 문제 수를 선택하세요
            </p>

            <div className="space-y-4 mb-6">
              {documents.map((doc) => {
                const docQuizSets = getQuizSetsForDocument(doc.id);
                const hasQuiz = docQuizSets.length > 0;
                const totalQuestionsAvailable = docQuizSets.reduce((sum, quiz) => sum + quiz.questions.length, 0);
                
                return (
                <div key={doc.id} className={`border rounded-lg p-4 ${!hasQuiz ? 'bg-gray-50 border-gray-300' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <FileText className={`h-5 w-5 ${hasQuiz ? 'text-[#22C7FB]' : 'text-gray-400'}`} />
                      <span className={`font-medium ${hasQuiz ? 'text-gray-900' : 'text-gray-500'}`}>
                        {doc.fileName}
                      </span>
                      {hasQuiz && (
                        <span className="text-xs text-gray-500">
                          (사용 가능: {totalQuestionsAvailable}문제)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-700">문제 수:</label>
                    <input
                      type="number"
                      min="0"
                      max={hasQuiz ? totalQuestionsAvailable : 0}
                      value={quizSettings[doc.id] || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setQuizSettings({
                          ...quizSettings,
                          [doc.id]: hasQuiz ? Math.min(value, totalQuestionsAvailable) : 0
                        });
                      }}
                      disabled={!hasQuiz}
                      className={`w-20 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C7FB] ${
                        !hasQuiz ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                      }`}
                    />
                    {!hasQuiz ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-red-600">문제 없음</span>
                        <Link
                          to={`/quiz/settings/${doc.id}`}
                          className="text-sm text-[#22C7FB] hover:text-[#1BB0E0] flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          먼저 만들기
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-green-600 flex items-center">
                        ✓ 사용 가능
                      </span>
                    )}
                  </div>
                </div>
              )})}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowQuizModal(false);
                  setQuizSettings({});
                }}
                disabled={generating}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={createCombinedQuiz}
                disabled={Object.values(quizSettings).reduce((a, b) => a + b, 0) === 0 || generating}
                className="px-4 py-2 text-sm font-medium text-white bg-[#22C7FB] rounded-md hover:bg-[#1BB0E0] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? '생성 중...' : `퀴즈 생성 (${Object.values(quizSettings).reduce((a, b) => a + b, 0)}문제)`}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {bottomHintMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm font-medium shadow-lg">
            {bottomHintMessage}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FolderView;
