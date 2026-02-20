import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import { FileText, RotateCcw, Trash2, FolderOpen } from 'lucide-react';
import type { Document, Folder } from '../types';

interface DeletedItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  deletedAt: Date;
  originalData: Folder | Document;
}

const Trash: React.FC = () => {
  const { currentUser } = useAuth();
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeletedItems();
  }, [currentUser]);

  const fetchDeletedItems = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const items: DeletedItem[] = [];

      const foldersQuery = query(
        collection(db, 'folders'),
        where('userId', '==', currentUser.uid)
      );
      const foldersSnapshot = await getDocs(foldersQuery);
      foldersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isDeleted === true) {
          items.push({
            id: docSnap.id,
            name: data.name,
            type: 'folder',
            deletedAt: data.deletedAt?.toDate?.() || new Date(),
            originalData: {
              id: docSnap.id,
              ...data,
              createdAt: data.createdAt?.toDate?.() || new Date(),
              updatedAt: data.updatedAt?.toDate?.() || new Date(),
            } as Folder,
          });
        }
      });

      const docsQuery = query(
        collection(db, 'documents'),
        where('userId', '==', currentUser.uid)
      );
      const docsSnapshot = await getDocs(docsQuery);
      docsSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.isDeleted === true) {
          items.push({
            id: docSnap.id,
            name: data.fileName,
            type: 'file',
            deletedAt: data.deletedAt?.toDate?.() || new Date(),
            originalData: {
              id: docSnap.id,
              ...data,
              uploadedAt: data.uploadedAt?.toDate?.() || new Date(),
            } as Document,
          });
        }
      });

      items.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
      setDeletedItems(items);
    } catch (error) {
      console.error('휴지통 항목 불러오기 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreItem = async (item: DeletedItem) => {
    try {
      const collectionName = item.type === 'folder' ? 'folders' : 'documents';
      await updateDoc(doc(db, collectionName, item.id), {
        isDeleted: false,
        deletedAt: null,
        updatedAt: serverTimestamp(),
      });

      if (item.type === 'folder') {
        const docsQuery = query(
          collection(db, 'documents'),
          where('userId', '==', currentUser?.uid),
          where('folderId', '==', item.id)
        );
        const docsSnapshot = await getDocs(docsQuery);
        const restorePromises = docsSnapshot.docs
          .filter((docSnap) => docSnap.data().isDeleted === true)
          .map((docSnap) =>
            updateDoc(doc(db, 'documents', docSnap.id), {
              isDeleted: false,
              deletedAt: null,
              updatedAt: serverTimestamp(),
            })
          );
        await Promise.all(restorePromises);
      }

      fetchDeletedItems();
    } catch (error) {
      console.error('복원 실패:', error);
    }
  };

  const permanentlyDelete = async (item: DeletedItem) => {
    if (!window.confirm('영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      const collectionName = item.type === 'folder' ? 'folders' : 'documents';
      await deleteDoc(doc(db, collectionName, item.id));

      if (item.type === 'folder') {
        const docsQuery = query(
          collection(db, 'documents'),
          where('userId', '==', currentUser?.uid),
          where('folderId', '==', item.id)
        );
        const docsSnapshot = await getDocs(docsQuery);
        const deletePromises = docsSnapshot.docs
          .filter((docSnap) => docSnap.data().isDeleted === true)
          .map((docSnap) =>
            deleteDoc(doc(db, 'documents', docSnap.id))
          );
        await Promise.all(deletePromises);
      }

      fetchDeletedItems();
    } catch (error) {
      console.error('영구 삭제 실패:', error);
    }
  };

  const emptyTrash = async () => {
    if (!window.confirm('휴지통을 비우시겠습니까? 모든 항목이 영구적으로 삭제됩니다.')) {
      return;
    }

    try {
      const deletePromises = deletedItems.map((item) => {
        const collectionName = item.type === 'folder' ? 'folders' : 'documents';
        return deleteDoc(doc(db, collectionName, item.id));
      });

      await Promise.all(deletePromises);
      fetchDeletedItems();
    } catch (error) {
      console.error('휴지통 비우기 실패:', error);
    }
  };

  return (
    <Layout>
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">휴지통</h1>
            <p className="mt-2 text-gray-600">삭제된 항목을 복원하거나 영구 삭제할 수 있습니다</p>
          </div>
          {deletedItems.length > 0 && (
            <button
              onClick={emptyTrash}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-5 w-5" />
              <span>휴지통 비우기</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C7FB]"></div>
            <p className="mt-4 text-gray-600">불러오는 중...</p>
          </div>
        ) : deletedItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Trash2 className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">휴지통이 비어있습니다</h3>
            <p className="mt-2 text-sm text-gray-500">삭제된 항목이 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="divide-y divide-gray-200">
              {deletedItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    {item.type === 'folder' ? (
                      <FolderOpen className="h-8 w-8 text-gray-400" />
                    ) : (
                      <FileText className="h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.type === 'folder' ? '폴더' : '파일'} • 
                        삭제일: {item.deletedAt.toLocaleDateString('ko-KR')} {item.deletedAt.toLocaleTimeString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => restoreItem(item)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-[#22C7FB] bg-[#22C7FB]/10 rounded-md hover:bg-[#22C7FB]/20"
                      title="복원"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>복원</span>
                    </button>
                    <button
                      onClick={() => permanentlyDelete(item)}
                      className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                      title="영구 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>영구 삭제</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Trash;
