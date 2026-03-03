import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SimplePdfViewer from '../components/SimplePdfViewer';
import DocumentLearningActions from '../components/documents/DocumentLearningActions';
import MoveFileModal from '../components/documents/MoveFileModal';
import QuizSetListModal from '../components/quiz/QuizSetListModal';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  FolderPlus, 
  Edit2, 
  Trash2,
  FolderInput,
  Folder as FolderIcon,
  Star,
} from 'lucide-react';
import type { Document, Folder, QuizSet, VocabularySet } from '../types';

const Documents: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedFolderId = searchParams.get('folder');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['default']));
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: 'folder' | 'file' } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [movingFile, setMovingFile] = useState<{ id: string; currentFolderId?: string } | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showNewFolderInModal, setShowNewFolderInModal] = useState(false);
  const [newFolderNameInModal, setNewFolderNameInModal] = useState('');
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [vocabularySets, setVocabularySets] = useState<VocabularySet[]>([]);
  const [showQuizListModal, setShowQuizListModal] = useState(false);
  const [selectedDocForQuizList, setSelectedDocForQuizList] = useState<Document | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    if (selectedFolderId === 'default') {
      setExpandedFolders(new Set(['default']));
    } else if (selectedFolderId) {
      setExpandedFolders(new Set([selectedFolderId]));
    }
  }, [selectedFolderId]);

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

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

      const docsQuery = query(
        collection(db, 'documents'),
        where('userId', '==', currentUser.uid)
      );
      const docsSnapshot = await getDocs(docsQuery);
      const fetchedDocs: Document[] = [];
      docsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isDeleted !== true) {
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

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const createFolder = async () => {
    if (!currentUser || !newFolderName.trim()) return;

    try {
      const trimmedName = newFolderName.trim();
      
      // "기본 폴더" 이름 체크
      if (trimmedName.toLowerCase() === '기본 폴더') {
        alert('"기본 폴더"는 시스템 예약 이름입니다. 다른 이름을 사용해주세요.');
        return;
      }
      
      // 중복된 폴더 이름 체크
      const duplicateFolder = folders.find(
        f => f.name.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (duplicateFolder) {
        alert('이미 같은 이름의 폴더가 존재합니다.');
        return;
      }

      await addDoc(collection(db, 'folders'), {
        userId: currentUser.uid,
        name: trimmedName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        isFavorite: false,
      });
      setNewFolderName('');
      setShowNewFolderInput(false);
      await fetchData();
    } catch (error) {
      console.error('폴더 생성 실패:', error);
    }
  };

  const toggleFavorite = async (folderId: string, currentFavorite: boolean) => {
    try {
      const folderRef = doc(db, 'folders', folderId);
      await updateDoc(folderRef, {
        isFavorite: !currentFavorite,
        updatedAt: serverTimestamp(),
      });
      await fetchData();
    } catch (error) {
      console.error('즐겨찾기 변경 실패:', error);
    }
  };

  const renameItem = async () => {
    if (!editingItem || !editingItem.name.trim()) return;

    try {
      const trimmedName = editingItem.name.trim();
      const collectionName = editingItem.type === 'folder' ? 'folders' : 'documents';
      const fieldName = editingItem.type === 'folder' ? 'name' : 'fileName';
      
      // 폴더 이름 변경인 경우에만 검증
      if (editingItem.type === 'folder') {
        // "기본 폴더" 이름 체크
        if (trimmedName.toLowerCase() === '기본 폴더') {
          alert('"기본 폴더"는 시스템 예약 이름입니다. 다른 이름을 사용해주세요.');
          setEditingItem(null);
          return;
        }
        
        // 중복된 폴더 이름 체크 (자기 자신은 제외)
        const duplicateFolder = folders.find(
          f => f.id !== editingItem.id && f.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (duplicateFolder) {
          alert('이미 같은 이름의 폴더가 존재합니다.');
          setEditingItem(null);
          return;
        }
      }
      
      const docRef = doc(db, collectionName, editingItem.id);
      await updateDoc(docRef, {
        [fieldName]: trimmedName,
        updatedAt: serverTimestamp(),
      });
      
      setEditingItem(null);
      fetchData();
    } catch (error) {
      console.error('이름 변경 실패:', error);
    }
  };

  const deleteItem = async (id: string, type: 'folder' | 'file') => {
    if (!window.confirm(type === 'folder' ? '이 폴더를 휴지통으로 이동하시겠습니까?' : '이 파일을 휴지통으로 이동하시겠습니까?')) {
      return;
    }

    try {
      const collectionName = type === 'folder' ? 'folders' : 'documents';
      await updateDoc(doc(db, collectionName, id), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
      });
      
      if (type === 'folder') {
        const folderDocs = documents.filter(d => d.folderId === id);
        for (const document of folderDocs) {
          const docRef = doc(db, 'documents', document.id);
          await updateDoc(docRef, {
            isDeleted: true,
            deletedAt: serverTimestamp(),
          });
        }
      }
      
      fetchData();
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  const handleContextMenu = (_e: React.MouseEvent, _type: 'folder' | 'file', _id: string, _name: string) => {
    _e.preventDefault();
    _e.stopPropagation();
  };

  const handleViewPdf = (doc: Document) => {
    if (doc.fileType === 'pdf') {
      setSelectedPdf({ url: doc.fileUrl, name: doc.fileName });
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

  const createFolderInModal = async () => {
    if (!currentUser || !newFolderNameInModal.trim()) return;

    try {
      const trimmedName = newFolderNameInModal.trim();
      
      // "기본 폴더" 이름 체크
      if (trimmedName.toLowerCase() === '기본 폴더') {
        alert('"기본 폴더"는 시스템 예약 이름입니다. 다른 이름을 사용해주세요.');
        return;
      }
      
      // 중복된 폴더 이름 체크
      const duplicateFolder = folders.find(
        f => f.name.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (duplicateFolder) {
        alert('이미 같은 이름의 폴더가 존재합니다.');
        return;
      }

      const docRef = await addDoc(collection(db, 'folders'), {
        userId: currentUser.uid,
        name: trimmedName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        isFavorite: false,
      });
      setNewFolderNameInModal('');
      setShowNewFolderInModal(false);
      await fetchData();
      if (movingFile) {
        await moveFile(docRef.id);
      }
    } catch (error) {
      console.error('폴더 생성 실패:', error);
    }
  };

  const getDocumentsByFolder = (folderId?: string) => {
    return documents.filter(doc => doc.folderId === folderId);
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

  const defaultFolderDocs = getDocumentsByFolder(undefined);

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">자료</h1>
            <p className="mt-2 text-gray-600">폴더별로 정리된 학습 자료</p>
          </div>
          <button
            onClick={() => setShowNewFolderInput(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#22C7FB] text-white rounded-lg hover:bg-[#1BB0E0] transition-colors"
          >
            <FolderPlus className="h-5 w-5" />
            <span>새 폴더</span>
          </button>
        </div>

        {showNewFolderInput && (
          <div className="mb-4 bg-white p-4 rounded-lg shadow-sm">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
              placeholder="폴더 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C7FB]"
              autoFocus
            />
            <div className="mt-2 flex space-x-2">
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-[#22C7FB] text-white rounded-md hover:bg-[#1BB0E0]"
              >
                생성
              </button>
              <button
                onClick={() => {
                  setShowNewFolderInput(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C7FB]"></div>
            <p className="mt-4 text-gray-600">불러오는 중...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleFolder('default')}
              >
                <div className="flex items-center space-x-2">
                  {expandedFolders.has('default') ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                  <FolderIcon className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">기본 폴더</span>
                  <span className="text-sm text-gray-500">({defaultFolderDocs.length})</span>
                </div>
              </div>

              {expandedFolders.has('default') && (
                <div className="border-t border-gray-200">
                  {defaultFolderDocs.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      파일이 없습니다
                    </div>
                  ) : (
                    defaultFolderDocs.map((doc) => {
                      const docQuizSets = getQuizSetsForDocument(doc.id);
                      const docVocabSets = getVocabularySetsForDocument(doc.id);
                      
                      return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        onContextMenu={(e) => handleContextMenu(e, 'file', doc.id, doc.fileName)}
                      >
                        {editingItem?.id === doc.id ? (
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && renameItem()}
                            onBlur={renameItem}
                            className="flex-1 px-2 py-1 border border-[#22C7FB] rounded focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => doc.fileType === 'pdf' && handleViewPdf(doc)}
                              className="flex items-center space-x-3 flex-1 text-left hover:text-[#22C7FB] transition-colors"
                            >
                              <FileText className="h-5 w-5 text-[#22C7FB]" />
                              <span className="text-sm text-gray-900">{doc.fileName}</span>
                              <span className="text-xs text-gray-500 uppercase">{doc.fileType}</span>
                            </button>
                            <div className="flex items-center space-x-2">
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
                                  setEditingItem({ id: doc.id, name: doc.fileName, type: 'file' });
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                title="이름 변경"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteItem(doc.id, 'file');
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
                                  isKoreanDocument={doc.language === 'ko'}
                                  onViewQuizzes={() => handleViewQuizzes(doc)}
                                  onCreateQuiz={() => handleCreateQuiz(doc)}
                                  onViewVocabulary={() => handleViewVocabulary(doc)}
                                  onCreateVocabulary={() => handleCreateVocabulary(doc)}
                                  className="flex items-center space-x-2"
                                />
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )})
                  )}
                </div>
              )}
            </div>

            {folders.sort((a, b) => {
              // 즐겨찾기 폴더를 먼저 배치
              if (a.isFavorite && !b.isFavorite) return -1;
              if (!a.isFavorite && b.isFavorite) return 1;
              return a.name.localeCompare(b.name);
            }).map((folder) => {
              const folderDocs = getDocumentsByFolder(folder.id);
              
              return (
                <div key={folder.id} className="bg-white rounded-lg shadow-sm">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleFolder(folder.id)}
                    onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      {expandedFolders.has(folder.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-600" />
                      )}
                      <FolderIcon className="h-5 w-5 text-[#22C7FB]" />
                      {editingItem?.id === folder.id ? (
                        <input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && renameItem()}
                          onBlur={renameItem}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-2 py-1 border border-[#22C7FB] rounded focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="font-medium text-gray-900">{folder.name}</span>
                          <span className="text-sm text-gray-500">({folderDocs.length})</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(folder.id, folder.isFavorite || false);
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title={folder.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                      >
                        <Star className={`h-4 w-4 ${folder.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingItem({ id: folder.id, name: folder.name, type: 'folder' });
                        }}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        title="이름 변경"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(folder.id, 'folder');
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {expandedFolders.has(folder.id) && (
                    <div className="border-t border-gray-200">
                      {folderDocs.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          파일이 없습니다
                        </div>
                      ) : (
                        folderDocs.map((doc) => {
                          const docQuizSets = getQuizSetsForDocument(doc.id);
                          const docVocabSets = getVocabularySetsForDocument(doc.id);
                          
                          return (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            onContextMenu={(e) => handleContextMenu(e, 'file', doc.id, doc.fileName)}
                          >
                            {editingItem?.id === doc.id ? (
                              <input
                                type="text"
                                value={editingItem.name}
                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                onKeyPress={(e) => e.key === 'Enter' && renameItem()}
                                onBlur={renameItem}
                                className="flex-1 px-2 py-1 border border-[#22C7FB] rounded focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <>
                                <button
                                  onClick={() => doc.fileType === 'pdf' && handleViewPdf(doc)}
                                  className="flex items-center space-x-3 flex-1 ml-7 text-left hover:text-[#22C7FB] transition-colors"
                                >
                                  <FileText className="h-5 w-5 text-[#22C7FB]" />
                                  <span className="text-sm text-gray-900">{doc.fileName}</span>
                                  <span className="text-xs text-gray-500 uppercase">{doc.fileType}</span>
                                </button>
                                <div className="flex items-center space-x-2">
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
                                      setEditingItem({ id: doc.id, name: doc.fileName, type: 'file' });
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                    title="이름 변경"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteItem(doc.id, 'file');
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
                              </>
                            )}
                          </div>
                        )})
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPdf && (
        <SimplePdfViewer
          fileUrl={selectedPdf.url}
          fileName={selectedPdf.name}
          onClose={() => setSelectedPdf(null)}
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
          extraContent={
            <>
              <button
                onClick={() => setShowNewFolderInModal(!showNewFolderInModal)}
                className="w-full mt-2 text-left px-4 py-2 text-sm text-[#22C7FB] hover:bg-[#22C7FB]/10 rounded-lg"
              >
                + 새 폴더 만들기
              </button>
              {showNewFolderInModal && (
                <div className="mt-2 flex space-x-2">
                  <input
                    type="text"
                    value={newFolderNameInModal}
                    onChange={(e) => setNewFolderNameInModal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && createFolderInModal()}
                    placeholder="폴더 이름"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22C7FB]"
                    autoFocus
                  />
                  <button
                    onClick={createFolderInModal}
                    className="px-4 py-2 bg-[#22C7FB] text-white rounded-md hover:bg-[#1BB0E0]"
                  >
                    생성
                  </button>
                </div>
              )}
            </>
          }
        />
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
    </Layout>
  );
};

export default Documents;
