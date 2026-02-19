import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { Upload, File, X, CheckCircle, AlertCircle, FolderOpen } from 'lucide-react';
import { processFile, getFileType } from '../utils/fileProcessor';
import type { Folder } from '../types';

const UploadDocument: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFolderId = searchParams.get('folderId');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  useEffect(() => {
    fetchFolders();
  }, [currentUser]);

  // 폴더 목록을 불러온 후 사전 선택된 폴더가 있으면 설정
  useEffect(() => {
    if (preselectedFolderId && folders.length > 0) {
      // 'default' 폴더이거나, 실제 존재하는 폴더인지 확인
      if (preselectedFolderId === 'default') {
        setSelectedFolder('');
      } else {
        const folderExists = folders.some(f => f.id === preselectedFolderId);
        if (folderExists) {
          setSelectedFolder(preselectedFolderId);
        }
      }
    }
  }, [preselectedFolderId, folders]);

  const fetchFolders = async () => {
    if (!currentUser) return;

    try {
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
    } catch (error) {
      console.error('폴더 불러오기 실패:', error);
    }
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
      
      const docRef = await addDoc(collection(db, 'folders'), {
        userId: currentUser.uid,
        name: trimmedName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        isFavorite: false,
      });
      setNewFolderName('');
      setShowNewFolderInput(false);
      setSelectedFolder(docRef.id);
      fetchFolders();
    } catch (error) {
      console.error('폴더 생성 실패:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = getFileType(file);
    if (!fileType) {
      setError('지원하지 않는 파일 형식입니다. PDF, PPT, Word 파일만 업로드 가능합니다.');
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;

    try {
      setUploading(true);
      setError('');

      setProcessing(true);
      const extractedContent = await processFile(selectedFile);
      setProcessing(false);

      const fileRef = ref(storage, `documents/${currentUser.uid}/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      const fileUrl = await getDownloadURL(fileRef);

      const docData: any = {
        userId: currentUser.uid,
        fileName: selectedFile.name,
        fileType: getFileType(selectedFile),
        fileUrl,
        uploadedAt: serverTimestamp(),
        processedAt: serverTimestamp(),
        isProcessed: true,
        language: extractedContent.language,
        extractedText: extractedContent.text,
        pages: extractedContent.pages,
        isDeleted: false,
      };

      if (selectedFolder) {
        docData.folderId = selectedFolder;
      }

      await addDoc(collection(db, 'documents'), docData);

      setSuccess(true);
      setTimeout(() => {
        navigate('/documents');
      }, 2000);

    } catch (err: any) {
      console.error('파일 업로드 실패:', err);
      setError(err.message || '파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fileType = getFileType(file);
      if (!fileType) {
        setError('지원하지 않는 파일 형식입니다. PDF, PPT, Word 파일만 업로드 가능합니다.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">파일 업로드</h1>
            <p className="mt-2 text-gray-600">
              학습 자료를 업로드하여 문제와 단어 사전을 생성하세요
            </p>
            {preselectedFolderId && (
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                <FolderOpen className="h-4 w-4 mr-1" />
                {preselectedFolderId === 'default' 
                  ? '기본 폴더에 저장됩니다' 
                  : folders.find(f => f.id === preselectedFolderId)?.name 
                    ? `"${folders.find(f => f.id === preselectedFolderId)?.name}" 폴더에 저장됩니다`
                    : '선택된 폴더에 저장됩니다'
                }
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            {success ? (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">업로드 완료!</h3>
                <p className="mt-2 text-gray-600">자료 페이지로 이동합니다...</p>
              </div>
            ) : (
              <>
                {folders.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FolderOpen className="inline h-4 w-4 mr-1" />
                      폴더 선택 (선택사항)
                    </label>
                    <select
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">기본 폴더</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      + 새 폴더 만들기
                    </button>
                    {showNewFolderInput && (
                      <div className="mt-2 flex space-x-2">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                          placeholder="폴더 이름"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={createFolder}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          생성
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={`border-2 border-dashed rounded-lg p-12 text-center ${
                    selectedFile
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {selectedFile ? (
                    <div className="space-y-4">
                      <File className="mx-auto h-16 w-16 text-blue-600" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        파일 제거
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-16 w-16 text-gray-400" />
                      <div>
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="text-blue-600 hover:text-blue-500 font-medium">
                            파일을 선택하거나
                          </span>
                          <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.ppt,.pptx,.doc,.docx"
                            onChange={handleFileSelect}
                          />
                        </label>
                        <span className="text-gray-600"> 드래그 앤 드롭</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        지원 형식: PDF, PowerPoint, Word
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 rounded-md bg-red-50 p-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <p className="ml-3 text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900">안내 사항</h3>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>파일 크기는 최대 50MB까지 지원됩니다</li>
                    <li>업로드된 파일은 자동으로 분석되어 문제와 단어 사전이 생성됩니다</li>
                    <li>영어 문서의 경우 단어 사전 기능을 이용할 수 있습니다</li>
                    <li>처리 시간은 파일 크기에 따라 다를 수 있습니다</li>
                  </ul>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading
                      ? processing
                        ? '파일 분석 중...'
                        : '업로드 중...'
                      : '업로드'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UploadDocument;
