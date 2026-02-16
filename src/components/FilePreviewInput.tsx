import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';

interface FilePreviewInputProps {
  label: string;
  value?: File | string | null; // File for new upload, string for existing URL
  onChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  error?: string;
}

export function FilePreviewInput({
  label,
  value,
  onChange,
  accept = 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png',
  disabled = false,
  error,
}: FilePreviewInputProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (file: File | null) => {
    if (file) {
      // Validate file type (some browsers report generic mime types)
      const normalizedName = file.name.toLowerCase();
      const isPdfByName = normalizedName.endsWith('.pdf');
      const isImageByName = normalizedName.endsWith('.jpg') || normalizedName.endsWith('.jpeg') || normalizedName.endsWith('.png');
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const isValidType = validTypes.includes(file.type) || isPdfByName || isImageByName || file.type.startsWith('image/');
      if (!isValidType) {
        alert('Please upload a PDF, JPG, or PNG file');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size cannot exceed 5MB');
        return;
      }

      // Create preview for images, create object URL for PDFs
      if (file.type.startsWith('image/') || isImageByName) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setPdfUrl(null);
      } else if (file.type === 'application/pdf' || isPdfByName) {
        const objectUrl = URL.createObjectURL(file);
        setPdfUrl(objectUrl);
        setPreview(null);
      } else {
        setPreview(null);
        setPdfUrl(null);
      }
      
      onChange(file);
    } else {
      setPreview(null);
      setPdfUrl(null);
      onChange(null);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  };

  // Get preview URL (existing file URL or preview)
  const previewUrl = typeof value === 'string' ? value : (value instanceof File ? preview : null);
  const isImage = typeof value === 'string'
    ? !!previewUrl && (previewUrl.startsWith('data:image') || previewUrl.match(/\.(jpg|jpeg|png)(\?|$)/i))
    : value instanceof File
    ? (value.type.startsWith('image/') || !!value.name.toLowerCase().match(/\.(jpg|jpeg|png)$/))
    : false;
  const isPdf = typeof value === 'string'
    ? !!previewUrl && (
        previewUrl.includes('pdf') ||
        previewUrl.match(/\.pdf(\?|$)/i) ||
        previewUrl.includes('/raw/upload/')
      )
    : value instanceof File
    ? (value.type === 'application/pdf' || value.name.toLowerCase().endsWith('.pdf'))
    : false;
  
  // Update preview when value changes (for existing URLs)
  React.useEffect(() => {
    if (typeof value === 'string' && value) {
      setPreview(value);
      setPdfUrl(null);
    } else if (!value) {
      setPreview(null);
      setPdfUrl(null);
    }
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div>
      <label className="block text-sm font-medium text-[#334155] mb-2">
        {label}
      </label>
      
      <div
        className={`border-2 border-dashed rounded-lg transition-colors ${
          isDragging
            ? 'border-[#1E3A8A] bg-[#EFF6FF]'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-[#E5E7EB] bg-white hover:border-[#1E3A8A] hover:bg-[#F8FAFC]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        {(previewUrl || (value instanceof File && isPdf)) ? (
          <div className="relative p-4">
            {isImage ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-contain rounded"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileChange(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : isPdf ? (
              <div className="flex flex-col items-center justify-center p-8">
                <FileText className="w-16 h-16 text-[#1E3A8A] mb-2" />
                <p className="text-sm text-[#334155] font-medium mb-1">PDF Document</p>
                {value instanceof File && (
                  <p className="text-xs text-[#64748B] mb-2">{value.name}</p>
                )}
                <a
                  href={pdfUrl || previewUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-[#1E3A8A] hover:underline"
                >
                  View Document
                </a>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileChange(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="mt-2 text-red-500 hover:text-red-600 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
            <p className="text-sm text-[#64748B] mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-[#64748B]">
              PDF, JPG, PNG (Max 5MB)
            </p>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          handleFileChange(file);
        }}
        disabled={disabled}
        className="hidden"
      />
      
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
