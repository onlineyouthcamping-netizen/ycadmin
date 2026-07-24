import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { toast } from 'sonner';
import { 
  UploadCloud, FileText, Download, Trash2, 
  AlertCircle, File, Loader2, Filter
} from 'lucide-react';

export interface DocumentItem {
  id: string;
  tripId: string;
  name?: string;
  fileName?: string;
  fileUrl: string;
  fileSize?: number;
  size?: string;
  category: 'permit' | 'insurance' | 'visa' | 'guide' | 'sop' | 'other' | string;
  mimeType?: string;
  uploadedBy?: string;
  createdAt: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DocumentUploadProps {
  tripId: string;
  onUploadComplete?: () => void;
}

const CATEGORIES = [
  { value: 'permit', label: 'Permit' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'visa', label: 'Visa / Pass' },
  { value: 'guide', label: 'Guide Brief' },
  { value: 'sop', label: 'SOP Document' },
  { value: 'other', label: 'Other Document' }
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ tripId, onUploadComplete }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('other');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // 1. Fetch Documents Query
  const {
    data: docsData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['trip-documents', tripId, filterCategory],
    queryFn: async () => {
      const url = filterCategory !== 'all' 
        ? `/trips/${tripId}/documents?category=${filterCategory}`
        : `/trips/${tripId}/documents`;
      const res = await api.get(url);
      return {
        documents: (res.data?.data?.documents || []) as DocumentItem[],
        total: res.data?.data?.total || 0
      };
    },
    enabled: !!tripId
  });

  // Helper: Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes || isNaN(bytes)) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper: Validate File
  const validateFile = (file: File): boolean => {
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedExts.includes(ext)) {
      toast.error(`Invalid file type (${ext}). Allowed: PDF, PNG, JPG, JPEG, DOCX`);
      return false;
    }

    if (file.size > maxSize) {
      toast.error(`File size (${formatFileSize(file.size)}) exceeds 10MB limit.`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // 2. Upload Handler using Axios with progress tracking
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select or drop a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('category', selectedCategory);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await api.post(`/trips/${tripId}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });

      toast.success('Document uploaded successfully!');
      setSelectedFile(null);
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ['trip-documents', tripId] });
      if (onUploadComplete) onUploadComplete();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Delete Document Mutation
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      return api.delete(`/trips/${tripId}/documents/${docId}`);
    },
    onSuccess: () => {
      toast.success('Document deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['trip-documents', tripId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete document');
    }
  });

  const documentsList = docsData?.documents || [];

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-[#0A192F] font-sans space-y-6">
      {/* ─── Top Upload Box & Dropzone ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-[#0A192F]">Upload Travel Documents</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Upload trip permits, insurance policy, guide briefs, or SOP docs (Max 10MB)</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Drag & Drop Target Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
            isDragging
              ? 'border-[#F97316] bg-orange-50/40 scale-[0.99]'
              : selectedFile
              ? 'border-emerald-300 bg-emerald-50/20'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.docx"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className={`p-3 rounded-full ${selectedFile ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-[#F97316]'}`}>
            <UploadCloud className="w-6 h-6" />
          </div>

          {selectedFile ? (
            <div className="space-y-1">
              <p className="text-xs font-bold text-emerald-800">{selectedFile.name}</p>
              <p className="text-[11px] text-slate-500 font-medium">{formatFileSize(selectedFile.size)} • Ready to upload</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">
                Drag & drop document file here, or <span className="text-[#F97316] underline">browse files</span>
              </p>
              <p className="text-[11px] text-slate-400 font-medium">Supported: PDF, PNG, JPG, JPEG, DOCX (Up to 10MB)</p>
            </div>
          )}
        </div>

        {/* Upload Progress Bar */}
        {isUploading && uploadProgress !== null && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F97316]" />
                Uploading document...
              </span>
              <span className="font-mono text-[#F97316]">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F97316] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        {selectedFile && !isUploading && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setSelectedFile(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              className="px-5 py-2 bg-[#F97316] hover:bg-[#e06100] text-white text-xs font-bold rounded-lg shadow-xs transition-all"
            >
              Confirm Upload
            </button>
          </div>
        )}
      </div>

      {/* ─── Uploaded Documents Section ─── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#0A192F]">Uploaded Documents</h3>
            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-xs">
              {docsData?.total || 0}
            </span>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs font-bold px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#F97316]"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl border border-slate-100 animate-pulse"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center border border-rose-200 rounded-xl bg-rose-50/20 space-y-2">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-xs font-bold text-slate-800">Failed to load documents</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700"
            >
              Retry
            </button>
          </div>
        ) : documentsList.length === 0 ? (
          <div className="p-12 text-center border border-slate-200 rounded-xl bg-slate-50/40 space-y-2">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700">No documents uploaded yet</h4>
            <p className="text-[11px] text-slate-400 font-medium">Drag and drop files in the box above to add trip documents.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {documentsList.map((doc) => {
              const fileName = doc.name || doc.fileName || 'Untitled Document';
              const fileUrl = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${api.defaults.baseURL?.replace(/\/api$/, '')}${doc.fileUrl}`;
              return (
                <div
                  key={doc.id}
                  className="p-4 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-orange-50 text-[#F97316] rounded-lg shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{fileName}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-medium">
                        <span className="uppercase font-bold text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {doc.category}
                        </span>
                        <span>•</span>
                        <span>{doc.size || formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download</span>
                    </a>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this document?')) {
                          deleteMutation.mutate(doc.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
