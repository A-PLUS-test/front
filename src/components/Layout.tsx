import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { LogOut, Home, Upload, FolderOpen, Trash2, ChevronDown, ChevronRight, Folder } from 'lucide-react';
import type { Folder as FolderType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isFoldersOpen, setIsFoldersOpen] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, [currentUser]);

  const fetchFolders = async () => {
    if (!currentUser) return;

    try {
      const foldersQuery = query(
        collection(db, 'folders'),
        where('userId', '==', currentUser.uid)
      );
      const foldersSnapshot = await getDocs(foldersQuery);
      const fetchedFolders: FolderType[] = [];
      foldersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.isDeleted !== true) {
          fetchedFolders.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
          } as FolderType);
        }
      });
      setFolders(fetchedFolders);
    } catch (error) {
      console.error('폴더 불러오기 실패:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-white shadow-lg fixed h-full flex flex-col">
        {/* 로고 */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-3">
            <img src="/aplus_icon.png" alt="APLUS" className="h-10 w-10" />
            <span className="text-2xl font-bold text-gray-900">APLUS</span>
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/upload"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/upload'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span>파일 업로드</span>
          </Link>
          
          <Link
            to="/"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home className="h-5 w-5" />
            <span>홈</span>
          </Link>
          
          <div>
            <button
              onClick={() => setIsFoldersOpen(!isFoldersOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FolderOpen className="h-5 w-5" />
                <span>자료</span>
              </div>
              {isFoldersOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            
            {isFoldersOpen && (
              <div className="ml-4 mt-1 space-y-1">
                <Link
                  to="/documents?folder=default"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Folder className="h-4 w-4" />
                  <span>무제 폴더</span>
                </Link>
                {folders.map((folder) => (
                  <Link
                    key={folder.id}
                    to={`/documents?folder=${folder.id}`}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Folder className="h-4 w-4" />
                    <span className="truncate">{folder.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <Link
            to="/trash"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/trash'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Trash2 className="h-5 w-5" />
            <span>휴지통</span>
          </Link>
        </nav>

        {/* 하단 사용자 정보 */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser?.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              title="로그아웃"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
};

export default Layout;
