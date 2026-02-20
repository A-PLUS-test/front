import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { BookOpen, Search, FileText, Loader, Plus } from 'lucide-react';
import type { Document, VocabularySet } from '../types';
import { generateVocabulary } from '../utils/vocabularyGenerator';

const Vocabulary: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { currentUser } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [vocabularySet, setVocabularySet] = useState<VocabularySet | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!documentId || !currentUser) return;

      try {
        // 문서 불러오기
        const docRef = doc(db, 'documents', documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = { id: docSnap.id, ...docSnap.data() } as Document;
          setDocument(docData);

          // 기존 단어 사전 확인
          const vocabQuery = query(
            collection(db, 'vocabularySets'),
            where('userId', '==', currentUser.uid),
            where('documentId', '==', documentId)
          );

          const vocabSnapshot = await getDocs(vocabQuery);
          
          if (!vocabSnapshot.empty) {
            const vocabData = {
              id: vocabSnapshot.docs[0].id,
              ...vocabSnapshot.docs[0].data(),
            } as VocabularySet;
            setVocabularySet(vocabData);
          }
        } else {
          setError('문서를 찾을 수 없습니다.');
        }
      } catch (err) {
        console.error('데이터 불러오기 실패:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId, currentUser]);

  const handleGenerateVocabulary = async () => {
    if (!document || !currentUser) return;

    if (document.language !== 'en') {
      setError('단어 사전은 영어 문서에서만 생성할 수 있습니다.');
      return;
    }

    try {
      setGenerating(true);
      setError('');

      // AI로 단어 사전 생성
      const words = await generateVocabulary(
        (document as any).extractedText || '',
        (document as any).pages || []
      );

      // Firestore에 저장
      const vocabData = {
        userId: currentUser.uid,
        documentId: document.id,
        title: `${document.fileName} - 단어 사전`,
        words,
        createdAt: serverTimestamp(),
      };

      const vocabRef = await addDoc(collection(db, 'vocabularySets'), vocabData);

      setVocabularySet({
        id: vocabRef.id,
        ...vocabData,
        createdAt: new Date(),
      } as VocabularySet);

    } catch (err: any) {
      console.error('단어 사전 생성 실패:', err);
      setError(err.message || '단어 사전 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-[#22C7FB]" />
        </div>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600">{error || '문서를 찾을 수 없습니다.'}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center text-[#22C7FB] hover:text-[#1BB0E0]"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </Layout>
    );
  }

  const filteredWords = vocabularySet?.words.filter(word =>
    word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    word.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-[#22C7FB]" />
              단어 사전
            </h1>
            <p className="mt-2 text-gray-600">{document.fileName}</p>
          </div>

          {vocabularySet ? (
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
                    placeholder="단어 검색..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#22C7FB]"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  총 {vocabularySet.words.length}개의 단어
                  {searchTerm && ` • ${filteredWords.length}개 검색됨`}
                </p>
              </div>

              {/* 단어 리스트 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredWords.map((word) => (
                  <div key={word.id} className="bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{word.word}</h3>
                      {word.pageNumber && (
                        <span className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          <FileText className="h-3 w-3 mr-1" />
                          p.{word.pageNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{word.meaning}</p>
                    {word.context && (
                      <p className="text-sm text-gray-500 italic border-l-2 border-[#22C7FB]/30 pl-3">
                        "{word.context}"
                      </p>
                    )}
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
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12">
              {document.language !== 'en' ? (
                <div className="text-center">
                  <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    단어 사전을 사용할 수 없습니다
                  </h3>
                  <p className="mt-2 text-gray-600">
                    단어 사전 기능은 영어 문서에서만 지원됩니다.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      홈으로 돌아가기
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <BookOpen className="mx-auto h-16 w-16 text-[#22C7FB]" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    단어 사전 생성하기
                  </h3>
                  <p className="mt-2 text-gray-600">
                    AI가 문서에서 중요한 단어를 추출하여 한국어 뜻과 함께 제공합니다.
                  </p>

                  {error && (
                    <div className="mt-4 rounded-md bg-red-50 p-4">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      onClick={handleGenerateVocabulary}
                      disabled={generating}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#22C7FB] hover:bg-[#1BB0E0] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generating ? (
                        <>
                          <Loader className="h-5 w-5 mr-2 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 mr-2" />
                          단어 사전 생성
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-6 bg-[#22C7FB]/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-[#0e8fb8]">안내</h4>
                    <ul className="mt-2 text-sm text-[#0e8fb8] space-y-1 list-disc list-inside text-left">
                      <li>AI가 문서에서 학술 용어와 중요한 단어를 자동으로 추출합니다</li>
                      <li>각 단어의 한국어 뜻과 문맥을 함께 제공합니다</li>
                      <li>생성 시간은 문서 크기에 따라 다를 수 있습니다</li>
                      <li>생성 후 검색 기능을 사용하여 단어를 찾을 수 있습니다</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Vocabulary;
