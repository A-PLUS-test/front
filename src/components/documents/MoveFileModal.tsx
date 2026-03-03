import React from 'react';
import { FileText } from 'lucide-react';
import type { Folder } from '../../types';

interface MoveFileModalProps {
  movingFile: { id: string; currentFolderId?: string };
  folders: Folder[];
  onMove: (targetFolderId?: string) => void;
  onClose: () => void;
  extraContent?: React.ReactNode;
}

const MoveFileModal: React.FC<MoveFileModalProps> = ({
  movingFile,
  folders,
  onMove,
  onClose,
  extraContent,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">파일 이동</h3>
        <p className="text-sm text-gray-600 mb-4">이동할 폴더를 선택하세요</p>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          <button
            onClick={() => onMove(undefined)}
            disabled={!movingFile.currentFolderId}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
              !movingFile.currentFolderId
                ? 'border-[#22C7FB] bg-[#22C7FB]/10 cursor-not-allowed'
                : 'border-gray-200 hover:border-[#22C7FB] hover:bg-[#22C7FB]/10'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="font-medium">기본 폴더</span>
              {!movingFile.currentFolderId && <span className="text-xs text-gray-500">(현재 위치)</span>}
            </div>
          </button>

          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onMove(folder.id)}
              disabled={movingFile.currentFolderId === folder.id}
              className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                movingFile.currentFolderId === folder.id
                  ? 'border-[#22C7FB] bg-[#22C7FB]/10 cursor-not-allowed'
                  : 'border-gray-200 hover:border-[#22C7FB] hover:bg-[#22C7FB]/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-[#22C7FB]" />
                <span className="font-medium">{folder.name}</span>
                {movingFile.currentFolderId === folder.id && (
                  <span className="text-xs text-gray-500">(현재 위치)</span>
                )}
              </div>
            </button>
          ))}
        </div>

        {extraContent}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveFileModal;
