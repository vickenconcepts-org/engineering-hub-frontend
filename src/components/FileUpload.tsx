import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  label?: string;
  helperText?: string;
  error?: string;
  accept?: string;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
}

export function FileUpload({
  label,
  helperText,
  error,
  accept = 'image/*,video/*',
  multiple = false,
  onChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const inputId = `file-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
    onChange?.(selectedFiles);
  };
  
  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onChange?.(newFiles);
  };
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs uppercase tracking-wide text-[#64748B] mb-2">
          {label}
        </label>
      )}
      
      <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
        error ? 'border-[#DC2626]' : 'border-[#E5E7EB]'
      }`}>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <Upload className="w-8 h-8 text-[#64748B]" />
          <span className="text-sm text-[#334155]">
            Click to upload or drag and drop
          </span>
          <span className="text-xs text-[#64748B]">
            {accept.includes('image') && 'Images'} {accept.includes('video') && '& Videos'}
          </span>
        </label>
      </div>
      
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-[#F8FAFC] px-3 py-2 rounded-lg"
            >
              <span className="text-sm text-[#334155] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-[#64748B] hover:text-[#DC2626] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-[#DC2626]">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>
      )}
    </div>
  );
}
