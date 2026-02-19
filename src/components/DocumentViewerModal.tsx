import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Modal } from './Modal';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentTitle?: string;
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  documentUrl,
  documentTitle = 'Document',
}: DocumentViewerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isPdf = documentUrl.includes('.pdf') || documentUrl.includes('/raw/upload/');
  const isImage = documentUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) || documentUrl.startsWith('data:image');

  useEffect(() => {
    if (isOpen && documentUrl) {
      setIsLoading(true);
      setError(null);
    }
  }, [isOpen, documentUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentTitle || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentTitle}
      size="lg"
      primaryAction={{
        label: 'Download',
        onClick: handleDownload,
      }}
      secondaryAction={{
        label: 'Close',
        onClick: onClose,
      }}
    >
      <div className="relative w-full h-[70vh] bg-[#F8FAFC] rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]"></div>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <FileText className="w-16 h-16 text-[#64748B] mb-4" />
            <p className="text-sm text-[#64748B] mb-2">Failed to load document</p>
            <p className="text-xs text-[#94A3B8]">{error}</p>
            <button
              onClick={() => window.open(documentUrl, '_blank')}
              className="mt-4 text-sm text-[#1E3A8A] hover:underline"
            >
              Open in new tab
            </button>
          </div>
        ) : isPdf ? (
          <iframe
            src={documentUrl}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load PDF');
            }}
            title={documentTitle}
          />
        ) : isImage ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={documentUrl}
              alt={documentTitle}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('Failed to load image');
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <FileText className="w-16 h-16 text-[#64748B] mb-4" />
            <p className="text-sm text-[#64748B] mb-2">Preview not available</p>
            <button
              onClick={() => window.open(documentUrl, '_blank')}
              className="text-sm text-[#1E3A8A] hover:underline"
            >
              Open in new tab
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
