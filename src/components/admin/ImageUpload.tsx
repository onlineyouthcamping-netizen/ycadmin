import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Image as ImageIcon, X, RefreshCw } from "lucide-react";
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
          toast.success("Uploaded successfully");
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
    <div className={cn("space-y-1.5 w-full", className)}>
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
          "relative flex flex-col items-center justify-center transition-all rounded-xl border-2 border-dashed select-none overflow-hidden",
          compact ? "p-1 min-h-[64px] h-full" : "p-5 gap-3 min-h-[130px]",
          isDragging 
            ? "border-[#FF6B00] bg-[#FF6B00]/5 scale-[1.01]" 
            : "border-slate-200/80 bg-slate-50/60 hover:bg-slate-100/60 hover:border-slate-300"
        )}
      >
        {value && !multiple ? (
          <div className={cn(
            "relative w-full rounded-lg overflow-hidden bg-slate-900/5 border border-slate-200 group/preview",
            compact ? "h-full min-h-[56px] aspect-square" : "aspect-video"
          )}>
            {!imgError ? (
              <img 
                src={displayUrl} 
                className="w-full h-full object-cover" 
                alt="Uploaded preview"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                <ImageIcon className={cn(compact ? "w-4 h-4" : "w-6 h-6")} />
                {!compact && <p className="text-[10px] font-bold uppercase opacity-60">Failed to load</p>}
              </div>
            )}
            
            {/* Control overlay buttons */}
            <div className={cn(
              "absolute flex gap-1 z-10 transition-opacity",
              compact ? "top-0.5 right-0.5" : "top-2 right-2"
            )}>
              {!compact && (
                <Button 
                  type="button"
                  variant="secondary" 
                  size="icon" 
                  className="w-6 h-6 rounded-full shadow-md bg-white/90 hover:bg-white text-slate-700 p-0"
                  title="Replace image"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplace();
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
              <Button 
                type="button"
                variant="destructive" 
                size="icon" 
                className={cn(
                  "rounded-full shadow-md bg-rose-600 hover:bg-rose-700 text-white p-0 flex items-center justify-center",
                  compact ? "w-4 h-4" : "w-6 h-6"
                )}
                title="Remove image"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className={cn(compact ? "w-2.5 h-2.5" : "w-3.5 h-3.5")} />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            onClick={compact ? handleReplace : undefined}
            className={cn("text-center cursor-pointer space-y-1", compact && "py-1 px-0.5")}
          >
            <div className={cn(
              "bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-500 shadow-2xs",
              compact ? "w-5 h-5" : "w-9 h-9"
            )}>
              <Upload className={cn(compact ? "w-2.5 h-2.5 text-[#FF6B00]" : "w-4 h-4 text-[#FF6B00]")} />
            </div>
            {compact ? (
              <p className="text-[9px] font-extrabold text-slate-600 uppercase tracking-tight">Add Photo</p>
            ) : (
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Drag &amp; drop {multiple ? 'photos' : 'photo'} here, or <span className="text-[#FF6B00] underline" onClick={handleReplace}>browse</span>
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  JPG, PNG, WEBP &middot; Max 50MB
                </p>
              </div>
            )}
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center rounded-xl z-20 p-2 space-y-1">
            <Loader2 className="w-4 h-4 text-[#FF6B00] animate-spin" />
            <div className="w-full max-w-[120px] h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-[#FF6B00] transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {!compact && (!value || multiple) && (
          <div className="flex w-full gap-2 items-center justify-center mt-1">
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
              className="flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold cursor-pointer hover:bg-slate-50 shadow-2xs px-3.5 h-8 transition-all"
            >
              Choose File
            </Label>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImageUpload;
