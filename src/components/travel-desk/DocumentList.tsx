import React, { useState } from "react";
import {
  Eye,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import DocumentViewer from "./DocumentViewer";
import { cn } from "@/lib/utils";

export interface DocumentItem {
  id: string;
  tripId?: string;
  title?: string;
  name?: string;
  fileName?: string;
  fileUrl: string;
  category?: string;
  status?: string;
  fileSize?: number;
  size?: string;
  version?: number;
  uploadedBy?: string;
  addedBy?: string;
  createdAt?: string;
  dateAdded?: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface DocumentListProps {
  documents: DocumentItem[];
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false);

  const handleView = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setIsViewerOpen(true);
  };

  const handleDownload = (fileUrl: string, fileName?: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "document";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      if (onDelete) {
        onDelete(id);
      }
    }
  };

  const getStatusConfig = (status?: string) => {
    switch (status) {
      case "APPROVED":
      case "published":
        return {
          color: "text-emerald-700 bg-emerald-50 border-emerald-200",
          icon: CheckCircle2,
        };
      case "UNDER_REVIEW":
      case "draft":
        return {
          color: "text-amber-700 bg-amber-50 border-amber-200",
          icon: Clock,
        };
      case "REJECTED":
        return {
          color: "text-rose-700 bg-rose-50 border-rose-200",
          icon: XCircle,
        };
      default:
        return {
          color: "text-slate-700 bg-slate-50 border-slate-200",
          icon: FileText,
        };
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="p-12 text-center border border-slate-200 rounded-xl bg-slate-50/40 space-y-2">
        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
        <h4 className="text-xs font-bold text-slate-700">No documents found</h4>
        <p className="text-[11px] text-slate-400 font-medium">
          No documents have been uploaded for this trip yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Document Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Added By</th>
                <th className="p-4">Date</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-slate-700 divide-y divide-slate-100">
              {documents.map((doc) => {
                const docTitle =
                  doc.title || doc.name || doc.fileName || "Untitled Document";
                const statusConfig = getStatusConfig(doc.status);
                const StatusIcon = statusConfig.icon;
                const formattedDate =
                  doc.createdAt || doc.dateAdded
                    ? new Date(
                        doc.createdAt || doc.dateAdded!,
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A";

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-orange-50 text-[#F97316] flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-slate-800 font-bold text-xs">
                            {docTitle}
                          </p>
                          <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                            v{doc.version || 1} •{" "}
                            {doc.size ||
                              (doc.fileSize
                                ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                                : "N/A")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-600 uppercase">
                      {doc.category || "Other"}
                    </td>
                    <td className="p-4">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
                          statusConfig.color,
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {doc.status || "published"}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {doc.uploader?.name ||
                        doc.uploadedBy ||
                        doc.addedBy ||
                        "System"}
                    </td>
                    <td className="p-4 text-xs text-slate-500 font-medium">
                      {formattedDate}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleView(doc)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc.fileUrl, docTitle)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render DocumentViewer Modal */}
      <DocumentViewer
        document={selectedDoc}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
    </>
  );
};

export default DocumentList;
