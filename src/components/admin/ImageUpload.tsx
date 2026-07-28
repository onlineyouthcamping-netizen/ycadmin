import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Image as ImageIcon, X, RefreshCw, CheckCircle } from "lucide-react";
import api from "@/services/api";
import { ENV } from "@/config/environment";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onMultipleUpload?: (urls: string[]) => void;
  label?: string;
  value?: string;
  multiple?: boolean;
  className?: string;
  compact?: boolean;
  accept?: string;
}

/**
 * Converts relative upload path to a full URL for display.
 */
const formatUrl = (url: any): string => {
  if (!url || typeof url !== 'string') return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  const serverBase = ENV.API_BASE_URL.replace(/\/api$/, "");
  return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function ImageUpload({
  onUpload,
  onMultipleUpload,
  label,
  value,
  multiple = false,
  className,
  compact = false,
  accept = "image/png, image/jpeg, image/webp"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [id] = useState(() => Math.random().toString(36).substring(7));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const maxLimitBytes = ENV.IMAGE_MAX_BYTES;
    const maxLimitMb = ENV.IMAGE_MAX_BYTES / (1024 * 1024);

    if (multiple) {
      const formData = new FormData();
      let validCount = 0;
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxLimitBytes) {
          toast.error(`File ${files[i].name} exceeds ${maxLimitMb}MB limit`);
          continue;
        }
        formData.append("images", files[i]);
        validCount++;
      }
      if (validCount === 0) return;
      
      setUploading(true);
      setImgError(false);
      try {
        const res = await api.post("/upload/multiple", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            setProgress(Math.round((e.loaded * 100) / (e.total || 1)));
          }
        });
        if (res.data.success) {
          if (onMultipleUpload) {
            onMultipleUpload(res.data.urls);
          } else {
            res.data.urls.forEach((url: string) => onUpload(url));
          }
          toast.success("Files uploaded successfully");
        } else {
          toast.error("Upload failed: " + (res.data.message || "Unknown error"));
        }
      } catch (err: any) {
        console.error("Upload failed:", err);
        toast.error("Upload failed: " + (err.response?.data?.message || err.message || "Network error"));
      } finally {
        setUploading(false);
        setProgress(0);
      }
    } else {
      const file = files[0];
      if (file.size > maxLimitBytes) {
        toast.error(`File size exceeds ${maxLimitMb}MB limit`);
        return;
      }
      const formData = new FormData();
      formData.append("image", file);
      
      setUploading(true);
      setImgError(false);
      try {
        const res = await api.post("/upload/single", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            setProgress(Math.round((e.loaded * 100) / (e.total || 1)));
          }
        });
        if (res.data.success) {
          onUpload(res.data.url);
          toast.success("Image uploaded successfully");
        } else {
          toast.error("Upload failed: " + (res.data.message || "Unknown error"));
        }
      } catch (err: any) {
        console.error("Upload failed:", err);
        toast.error("Upload failed: " + (err.response?.data?.message || err.message || "Network error"));
      } finally {
        setUploading(false);
        setProgress(0);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = async () => {
    if (!value) return;
    if (typeof value === 'string' && value.startsWith('/uploads/')) {
      try {
        await api.delete("/upload/photo", { data: { url: value } });
      } catch (err) {
        console.warn("Server delete failed (continuing):", err);
      }
    }
    onUpload("");
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [multiple]);

  const displayUrl = formatUrl(value);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && !compact && (
        <Label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          {label}
        </Label>
      )}

      {/* Hidden file input for replace / select */}
      <Input 
        ref={fileInputRef}
        type="file" 
        accept={accept} 
        multiple={multiple}
        onChange={handleFileChange} 
        className="hidden" 
        id={`file-replace-${id}`}
      />

      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center transition-all rounded-xl border-2 border-dashed select-none",
          compact ? "p-2 gap-1 min-h-[72px]" : "p-5 gap-3 min-h-[140px]",
          isDragging 
            ? "border-[#FF6B00] bg-[#FF6B00]/5 scale-[1.01]" 
            : "border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/60 hover:border-slate-300"
        )}
      >
        {value && !multiple ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-950/5 border border-slate-200">
            {!imgError ? (
              <img 
                src={displayUrl} 
                className="w-full h-full object-contain" 
                alt="Uploaded preview"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                <p className="text-[10px] font-bold uppercase opacity-60">Image failed to load</p>
              </div>
            )}
            
            {/* Control buttons */}
            <div className="absolute top-2 right-2 flex gap-1.5 z-10">
              <Button 
                variant="secondary" 
                size="icon" 
                className="w-7 h-7 rounded-full shadow-md bg-white/90 hover:bg-white text-slate-700"
                title="Replace image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReplace();
                }}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="w-7 h-7 rounded-full shadow-md bg-rose-600 hover:bg-rose-700 text-white"
                title="Remove image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-1.5">
            <div className={cn(
              "bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-500 shadow-2xs",
              compact ? "w-6 h-6" : "w-10 h-10"
            )}>
              <Upload className={cn(compact ? "w-3 h-3" : "w-4 h-4 text-[#FF6B00]")} />
            </div>
            {!compact && (
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Drag &amp; drop {multiple ? 'photos' : 'photo'} here, or <span className="text-[#FF6B00] underline cursor-pointer" onClick={handleReplace}>browse</span>
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  JPG, PNG, WEBP &middot; Max 50MB
                </p>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl z-20 p-4 space-y-2">
            <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
            <div className="w-full max-w-[160px] h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-[#FF6B00] transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">{progress}% Uploading</p>
          </div>
        )}

        {(!value || multiple) && (
          <div className={cn("flex w-full gap-2 items-center justify-center", compact ? "mt-0" : "mt-1")}>
            <Input 
              type="file" 
              accept={accept} 
              multiple={multiple}
              onChange={handleFileChange} 
              className="hidden" 
              id={`file-upload-${id}`} 
              disabled={uploading}
            />
            <Label 
              htmlFor={`file-upload-${id}`}
              className={cn(
                "flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50 shadow-2xs transition-all",
                compact ? "px-2 h-6 text-[10px]" : "px-3.5 h-8"
              )}
            >
              {compact ? 'Add Photo' : 'Choose File'}
            </Label>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;
