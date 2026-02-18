import React from 'react';
import { X } from 'lucide-react';

interface SimplePdfViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

const SimplePdfViewer: React.FC<SimplePdfViewerProps> = ({ fileUrl, fileName, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* PDF 뷰어 영역 - iframe 사용 */}
        <div className="flex-1 overflow-hidden">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      </div>
    </div>
  );
};

export default SimplePdfViewer;
