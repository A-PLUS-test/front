import React from 'react';
import { FileText } from 'lucide-react';
import type { Document } from '../../types';

interface DocumentListItemProps {
  document: Document;
  onOpen: () => void;
  actions?: React.ReactNode;
  showFileType?: boolean;
}

const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document,
  onOpen,
  actions,
  showFileType = false,
}) => {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <button onClick={onOpen} className="flex items-center space-x-4 flex-1 text-left">
          <div className="w-10 h-10 bg-[#22C7FB]/20 rounded-lg flex items-center justify-center">
            <FileText className="h-6 w-6 text-[#22C7FB]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{document.fileName}</h3>
            <div className="flex items-center space-x-3 mt-1">
              {showFileType && <span className="text-xs text-gray-500 uppercase">{document.fileType}</span>}
              <span className="text-xs text-gray-400">
                {new Date(document.uploadedAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </button>
        {actions}
      </div>
    </div>
  );
};

export default DocumentListItem;
