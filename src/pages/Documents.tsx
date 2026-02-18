import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import SimplePdfViewer from '../components/SimplePdfViewer';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  FolderPlus, 
  Edit2, 
  Trash2, 
  MoreVertical,
  Eye,
  FolderInput
} from 'lucide-react';
import type { Document, Folder } from '../types';

const Documents: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const selectedFolderId = searchParams.get('folder');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['default']));
  const [loading, setLoading] = useState(true);
  const [selectedPdf, setSelectedPdf] = useState<{ url: string; name: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ 
    show: boolean; 
    x: number; 
    y: number; 
    type: 'folder' | 'file'; 
    id: string;
    name: string;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: 'folder' | 'file' } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [movingFile, setMovingFile] = useState<{ id: string; currentFolderId?: string } | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      await addDoc(collection(db, 'folders'), {
        userId: currentUser.uid,
        name: newFolderName.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
      });
      setNewFolderName('');
      setShowNewFolderInput(false);
      fetchData();
    } catch (error) {
      console.error('폴더 생성 실패:', error);
    }
  };

  const renameItem = async () => {
    if (!editingItem || !editingItem.name.trim()) return;

    try {
      const collectionName = editingItem.type === 'folder' ? 'folders' : 'documents';
      const fieldName = editingItem.type === 'folder' ? 'name' : 'fileName';
      
      await updateDoc(doc(db, collectionName, editingItem.id), {
        [fieldName]: editingItem.name.trim(),
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
        for (const doc of folderDocs) {
          await updateDoc(doc(db, 'documents', doc.id), {
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

  const handleContextMenu = (e: React.MouseEvent, type: 'folder' | 'file', id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      type,
      id,
      name,
    });
  };

  const handleViewPdf = (doc: Document) => {
    if (doc.fileType === 'pdf') {
      setSelectedPdf({ url: doc.fileUrl, name: doc.fileName });
    }
  };

  const moveFile = async (targetFolderId?: string) => {
    if (!movingFile) return;

    try {
      await updateDoc(doc(db, 'documents', movingFile.id), {
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

  const getDocumentsByFolder = (folderId?: string) => {
    return documents.filter(doc => doc.folderId === folderId);
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
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="mt-2 flex space-x-2">
              <button
                onClick={createFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                  <FileText className="h-5 w-5 text-gray-600" />
                  <span className="font-medium text-gray-900">무제 폴더</span>
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
                    defaultFolderDocs.map((doc) => (
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
                            className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => doc.fileType === 'pdf' && handleViewPdf(doc)}
                              className="flex items-center space-x-3 flex-1 text-left hover:text-blue-600 transition-colors"
                            >
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="text-sm text-gray-900">{doc.fileName}</span>
                              <span className="text-xs text-gray-500 uppercase">{doc.fileType}</span>
                            </button>
                            <div className="flex items-center space-x-2">
                              {doc.fileType === 'pdf' && (
                                <button
                                  onClick={() => handleViewPdf(doc)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                  title="미리보기"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
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
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {folders.map((folder) => {
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
                      <FileText className="h-5 w-5 text-blue-600" />
                      {editingItem?.id === folder.id ? (
                        <input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && renameItem()}
                          onBlur={renameItem}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none"
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
                        folderDocs.map((doc) => (
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
                                className="flex-1 px-2 py-1 border border-blue-500 rounded focus:outline-none"
                                autoFocus
                              />
                            ) : (
                              <>
                                <button
                                  onClick={() => doc.fileType === 'pdf' && handleViewPdf(doc)}
                                  className="flex items-center space-x-3 flex-1 ml-7 text-left hover:text-blue-600 transition-colors"
                                >
                                  <FileText className="h-5 w-5 text-blue-600" />
                                  <span className="text-sm text-gray-900">{doc.fileName}</span>
                                  <span className="text-xs text-gray-500 uppercase">{doc.fileType}</span>
                                </button>
                                <div className="flex items-center space-x-2">
                                  {doc.fileType === 'pdf' && (
                                    <button
                                      onClick={() => handleViewPdf(doc)}
                                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                                      title="미리보기"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  )}
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
                                </div>
                              </>
                            )}
                          </div>
                        ))
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
                  <span className="font-medium">무제 폴더</span>
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
    </Layout>
  );
};

export default Documents;
