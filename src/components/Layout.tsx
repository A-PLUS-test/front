import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Home, Upload, FolderOpen, Trash2, ChevronDown, ChevronRight, Folder, Star } from 'lucide-react';
import type { Folder as FolderType } from '../types';
import { createFolderForUser, fetchFoldersByUser, toggleFolderFavorite } from '../services/firestore';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isFoldersOpen, setIsFoldersOpen] = useState(() => {
    const saved = localStorage.getItem('foldersOpen');
    return saved ? JSON.parse(saved) : false;
  });
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchFolders();
  }, [currentUser, location.pathname]);

  useEffect(() => {
    localStorage.setItem('foldersOpen', JSON.stringify(isFoldersOpen));
  }, [isFoldersOpen]);

  const fetchFolders = async () => {
    if (!currentUser) return;

    try {
      const fetchedFolders = await fetchFoldersByUser(currentUser.uid);
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

  const createFolder = async () => {
    if (!currentUser || !newFolderName.trim()) return;

    try {
      // 중복된 폴더 이름 체크
      const duplicateFolder = folders.find(
        f => f.name.toLowerCase() === newFolderName.trim().toLowerCase()
      );
      
      if (duplicateFolder) {
        alert('이미 같은 이름의 폴더가 존재합니다.');
        return;
      }

      await createFolderForUser(currentUser.uid, newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
      fetchFolders();
    } catch (error) {
      console.error('폴더 생성 실패:', error);
    }
  };

  const toggleFavorite = async (folderId: string, currentFavorite: boolean) => {
    try {
      await toggleFolderFavorite(folderId, currentFavorite);
      fetchFolders();
    } catch (error) {
      console.error('즐겨찾기 변경 실패:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-white shadow-lg fixed h-full flex flex-col">
        {/* 로고 */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/home" className="flex items-center space-x-3">
            <img src="/aplus_icon.png" alt="APLUS" className="h-10 w-10" />
            <span className="text-2xl logo-font" style={{ color: '#22C7FB' }}>APLUS</span>
          </Link>
        </div>

        {/* 네비게이션 메뉴 */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/upload"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/upload'
                ? 'bg-[#22C7FB]/10 text-[#22C7FB]'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span>파일 업로드</span>
          </Link>
          
          <Link
            to="/home"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/home' || location.pathname === '/'
                ? 'bg-[#22C7FB]/10 text-[#22C7FB]'
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
                  to="/documents"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>전체 보기</span>
                </Link>
                <Link
                  to="/folder/default"
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <Folder className="h-4 w-4" />
                  <span>기본 폴더</span>
                </Link>
                {folders.sort((a, b) => {
                  // 즐겨찾기 폴더를 먼저 배치
                  if (a.isFavorite && !b.isFavorite) return -1;
                  if (!a.isFavorite && b.isFavorite) return 1;
                  return a.name.localeCompare(b.name);
                }).map((folder) => (
                  <div key={folder.id} className="flex items-center">
                    <Link
                      to={`/folder/${folder.id}`}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors flex-1"
                    >
                      <Folder className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{folder.name}</span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorite(folder.id, folder.isFavorite || false);
                      }}
                      className="p-1 mr-2"
                      title={folder.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    >
                      <Star 
                        className={`h-4 w-4 ${folder.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                      />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowNewFolderInput(true)}
                  className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-[#22C7FB] hover:bg-[#22C7FB]/10 transition-colors"
                >
                  <span className="text-lg">+</span>
                  <span>새 폴더</span>
                </button>
                {showNewFolderInput && (
                  <div className="px-4 py-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') createFolder();
                        if (e.key === 'Escape') {
                          setShowNewFolderInput(false);
                          setNewFolderName('');
                        }
                      }}
                      onBlur={() => {
                        if (!newFolderName.trim()) {
                          setShowNewFolderInput(false);
                        }
                      }}
                      placeholder="폴더 이름"
                      className="w-full px-2 py-1 text-sm border border-[#22C7FB] rounded focus:outline-none focus:ring-1 focus:ring-[#22C7FB]"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          
          <Link
            to="/trash"
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/trash'
                ? 'bg-[#22C7FB]/10 text-[#22C7FB]'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Trash2 className="h-5 w-5" />
            <span>휴지통</span>
          </Link>
        </nav>

        {/* 서비스 소개 버튼 */}
        <div className="px-4 pb-4">
          <Link
            to="/about"
            className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium text-[#22C7FB] bg-[#22C7FB]/10 hover:bg-[#22C7FB]/20 transition-colors border border-[#22C7FB]/30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>서비스 소개</span>
          </Link>
        </div>

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
