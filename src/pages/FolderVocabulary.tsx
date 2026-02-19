import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { BookOpen, Search, FileText, Loader, ChevronLeft } from 'lucide-react';
import type { Document, VocabularySet, Folder } from '../types';

interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  context?: string;
  pageNumber?: number;
  documentName: string;
  documentId: string;
}

const FolderVocabulary: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allWords, setAllWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // 폴더 정보 가져오기 (default가 아닌 경우)
        if (folderId && folderId !== 'default') {
          const folderRef = doc(db, 'folders', folderId);
          const folderSnap = await getDoc(folderRef);
          
          if (folderSnap.exists()) {
            const folderData = folderSnap.data();
            setFolder({
              id: folderSnap.id,
              ...folderData,
              createdAt: folderData.createdAt?.toDate?.() || new Date(),
              updatedAt: folderData.updatedAt?.toDate?.() || new Date(),
            } as Folder);
          }
        }

        // 폴더 내 문서 가져오기
        const docsQuery = query(
          collection(db, 'documents'),
          where('userId', '==', currentUser.uid)
        );
        const docsSnapshot = await getDocs(docsQuery);
        const fetchedDocs: Document[] = [];

        docsSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const docFolderId = data.folderId || 'default';
          
          if (docFolderId === folderId && data.isDeleted !== true && data.language === 'en') {
            fetchedDocs.push({
              id: docSnap.id,
              ...data,
              uploadedAt: data.uploadedAt?.toDate?.() || new Date(),
            } as Document);
          }
        });

        setDocuments(fetchedDocs);

        if (fetchedDocs.length === 0) {
          setError('이 폴더에 영어 문서가 없습니다.');
          setLoading(false);
          return;
        }

        // 모든 문서의 단어장 가져오기
        const documentIds = fetchedDocs.map(d => d.id);
        const vocabQuery = query(
          collection(db, 'vocabularySets'),
          where('userId', '==', currentUser.uid),
          where('documentId', 'in', documentIds)
        );

        const vocabSnapshot = await getDocs(vocabQuery);
        const words: VocabularyWord[] = [];

        vocabSnapshot.forEach((vocabDoc) => {
          const vocabData = vocabDoc.data() as VocabularySet;
          const document = fetchedDocs.find(d => d.id === vocabData.documentId);
          
          if (document && vocabData.words) {
            vocabData.words.forEach((word) => {
              words.push({
                ...word,
                documentName: document.fileName,
                documentId: document.id,
              });
            });
          }
        });

        setAllWords(words);

        if (words.length === 0) {
          setError('이 폴더에 생성된 단어장이 없습니다.');
        }
      } catch (err) {
        console.error('데이터 불러오기 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [folderId, currentUser]);

  const filteredWords = allWords.filter(word =>
    word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.meaning.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.documentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const folderName = folder?.name || (folderId === 'default' ? '기본 폴더' : '무제 폴더');

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <button
              onClick={() => navigate(folderId === 'default' ? '/folder/default' : `/folder/${folderId}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              폴더로 돌아가기
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
              {folderName} - 통합 단어장
            </h1>
            <p className="mt-2 text-gray-600">
              {documents.length}개의 영어 문서
            </p>
          </div>

          {error ? (
            <div className="bg-white rounded-lg shadow-sm p-12">
              <div className="text-center">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  {error}
                </h3>
                <p className="mt-2 text-gray-600">
                  영어 문서를 업로드하고 단어장을 생성해보세요.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate(folderId === 'default' ? '/folder/default' : `/folder/${folderId}`)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    폴더로 돌아가기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 검색 */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="단어 또는 문서 이름 검색..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  총 {allWords.length}개의 단어
                  {searchTerm && ` • ${filteredWords.length}개 검색됨`}
                </p>
              </div>

              {/* 문서별 단어 수 통계 */}
              <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">문서별 단어 수</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {documents.map((doc) => {
                    const docWords = allWords.filter(w => w.documentId === doc.id);
                    return (
                      <Link
                        key={doc.id}
                        to={`/vocabulary/${doc.id}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <span className="text-sm text-gray-900 truncate">{doc.fileName}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600 ml-2">
                          {docWords.length}개
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 단어 리스트 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWords.map((word, index) => (
                  <div key={`${word.documentId}-${word.id || index}`} className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{word.word}</h3>
                      <div className="flex flex-col items-end space-y-1">
                        {word.pageNumber && (
                          <span className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            <FileText className="h-3 w-3 mr-1" />
                            p.{word.pageNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{word.meaning}</p>
                    {word.context && (
                      <p className="text-sm text-gray-500 italic border-l-2 border-blue-200 pl-3 mb-2">
                        "{word.context}"
                      </p>
                    )}
                    <Link
                      to={`/vocabulary/${word.documentId}`}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      {word.documentName}
                    </Link>
                  </div>
                ))}
              </div>

              {filteredWords.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">검색 결과가 없습니다</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FolderVocabulary;
