import React, { useState, useEffect } from "react";
import {
  Upload, Search, FileText, CheckCircle2, XCircle, AlertCircle, Clock, Trash2, ShieldAlert, Download, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { opsService } from "@/services/ops.service";

interface DepartureDocumentsProps {
  tripId: string;
  departureDateStr: string;
}

export default function DepartureDocuments({ tripId, departureDateStr }: DepartureDocumentsProps) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");

  // Modals & Upload State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docForm, setDocForm] = useState({
    category: "HOTEL_VOUCHER",
    originalFileName: "",
    fileUrl: "",
    fileSize: 0,
    remarks: ""
  });

  // Verification Modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [verifyForm, setVerifyForm] = useState({
    status: "Verified",
    remarks: ""
  });

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await opsService.getDocuments(tripId, departureDateStr);
      setDocs(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [tripId, departureDateStr]);

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.fileUrl) {
      toast.error("Please enter a file URL");
      return;
    }
    setUploading(true);
    try {
      // Deduce name if missing
      const fileName = docForm.originalFileName || docForm.fileUrl.split("/").pop() || "Document";
      await opsService.createDocument(tripId, departureDateStr, {
        ...docForm,
        originalFileName: fileName,
        fileSize: Math.floor(Math.random() * 800000) + 150000 // simulate file size in bytes
      });
      toast.success("Document uploaded successfully!");
      setUploadModalOpen(false);
      setDocForm({
        category: "HOTEL_VOUCHER",
        originalFileName: "",
        fileUrl: "",
        fileSize: 0,
        remarks: ""
      });
      fetchDocs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save document");
    } finally {
      setUploading(false);
    }
  };

  // Verification submission
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;
    try {
      await opsService.verifyDocument(selectedDoc.id, verifyForm.status, verifyForm.remarks);
      toast.success("Document verification updated!");
      setVerifyModalOpen(false);
      setSelectedDoc(null);
      fetchDocs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update verification status");
    }
  };

  // Delete document
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await opsService.deleteDocument(id);
      toast.success("Document deleted successfully!");
      fetchDocs();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete document");
    }
  };

  const filteredDocs = docs.filter(d => {
    const matchCat = categoryFilter === "All Categories" || d.category === categoryFilter;
    const matchStatus = statusFilter === "All Status" || d.verificationStatus === statusFilter;
    const matchSearch = search === "" || d.originalFileName.toLowerCase().includes(search.toLowerCase()) || (d.remarks && d.remarks.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* File Type Filter Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { key: "PASSENGER", label: "Passenger Docs", count: docs.filter(d => d.category === "PASSENGER").length, desc: "Aadhaar, Passports" },
          { key: "PAYMENT_PROOF", label: "Payment Proofs", count: docs.filter(d => d.category === "PAYMENT_PROOF").length, desc: "Receipts, Screenshots" },
          { key: "HOTEL_VOUCHER", label: "Hotel Vouchers", count: docs.filter(d => d.category === "HOTEL_VOUCHER").length, desc: "Booking Confirmations" },
          { key: "VEHICLE", label: "Vehicle Documents", count: docs.filter(d => d.category === "VEHICLE").length, desc: "RC, Permits, Insurance" },
          { key: "GUIDE_ID", label: "Guide IDs", count: docs.filter(d => d.category === "GUIDE_ID").length, desc: "License, Badge, Aadhaar" },
          { key: "OPERATIONAL", label: "Operational Files", count: docs.filter(d => d.category === "OPERATIONAL").length, desc: "Checklists, SOPs, Lists" }
        ].map(tile => (
          <button
            key={tile.key}
            onClick={() => setCategoryFilter(categoryFilter === tile.key ? "All Categories" : tile.key)}
            className={cn(
              "border text-left rounded-[6px] p-3 shadow-3xs hover:border-slate-350 transition-all",
              categoryFilter === tile.key ? "bg-[#F97316]/5 border-[#F97316] text-[#F97316]" : "bg-white border-[#E2E8F0] text-slate-800"
            )}
          >
            <div className="flex justify-between items-start">
              <FileText className={cn("w-4.5 h-4.5 mb-1.5", categoryFilter === tile.key ? "text-[#F97316]" : "text-slate-400")} />
              <span className="text-sm font-black">{tile.count}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider">{tile.label}</p>
            <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">{tile.desc}</p>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] p-3.5 shadow-xs flex flex-wrap gap-2.5 items-center">
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
          <option value="All Categories">All Categories</option>
          <option value="PASSENGER">Passenger Documents</option>
          <option value="PAYMENT_PROOF">Payment Proofs</option>
          <option value="HOTEL_VOUCHER">Hotel Vouchers</option>
          <option value="VEHICLE">Vehicle Documents</option>
          <option value="GUIDE_ID">Guide IDs</option>
          <option value="OPERATIONAL">Operational Files</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-8 text-[11px] font-bold border border-slate-200 rounded-[4px] px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer">
          <option value="All Status">All Verification Status</option>
          <option value="Pending">Pending</option>
          <option value="Verified">Verified</option>
          <option value="Rejected">Rejected</option>
          <option value="Action Required">Action Required</option>
        </select>
        <div className="relative flex-1 max-w-xs min-w-[150px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input type="text" placeholder="Search file name, notes..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 w-full pl-8 text-[11px] rounded-[4px] border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none" />
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="h-8 text-[11px] font-bold bg-[#F97316] hover:bg-[#E05E00] text-white rounded-[4px] px-3.5 flex items-center gap-1.5 shadow-xs ml-auto"
        >
          <Upload className="w-3.5 h-3.5" /> Upload Document
        </button>
      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[6px] overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-[#E2E8F0]">
            <tr className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wider">
              <th className="p-3 border-r border-slate-100">FILE NAME</th>
              <th className="p-3 border-r border-slate-100">CATEGORY</th>
              <th className="p-3 border-r border-slate-100">UPLOADED BY</th>
              <th className="p-3 border-r border-slate-100">SIZE</th>
              <th className="p-3 border-r border-slate-100 text-center">VERIFICATION</th>
              <th className="p-3 border-r border-slate-100">REMARKS</th>
              <th className="p-3 text-center w-40">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">Loading documents list...</td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">No documents uploaded for this category.</td>
              </tr>
            ) : (
              filteredDocs.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#F97316]" />
                      <div>
                        <p className="font-extrabold text-slate-800">{d.originalFileName}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Uploaded {new Date(d.createdAt).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 border-r border-slate-100">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">{d.category.replace(/_/g, " ")}</span>
                  </td>
                  <td className="p-3 border-r border-slate-100 font-bold text-slate-700">{d.uploadedBy?.name || "Staff"}</td>
                  <td className="p-3 border-r border-slate-100 font-semibold text-slate-500">{(d.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="p-3 border-r border-slate-100 text-center">
                    <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider inline-flex items-center gap-1",
                      d.verificationStatus === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      d.verificationStatus === "Rejected" ? "bg-red-50 text-red-700 border-red-100" :
                      d.verificationStatus === "Action Required" ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-blue-50 text-blue-700 border-blue-100"
                    )}>
                      {d.verificationStatus === "Verified" && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {d.verificationStatus === "Rejected" && <XCircle className="w-2.5 h-2.5" />}
                      {d.verificationStatus === "Action Required" && <AlertCircle className="w-2.5 h-2.5" />}
                      {d.verificationStatus === "Pending" && <Clock className="w-2.5 h-2.5" />}
                      {d.verificationStatus}
                    </span>
                  </td>
                  <td className="p-3 border-r border-slate-100 text-slate-650 font-medium max-w-[200px] truncate">{d.remarks || "—"}</td>
                  <td className="p-3 text-center">
                    <div className="flex gap-1.5 justify-center">
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-[9.5px] font-bold px-2 py-1 rounded flex items-center gap-1">
                        <Eye className="w-3 h-3 text-slate-400" /> View
                      </a>
                      <button
                        onClick={() => {
                          setSelectedDoc(d);
                          setVerifyForm({
                            status: d.verificationStatus,
                            remarks: d.remarks || ""
                          });
                          setVerifyModalOpen(true);
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-650 text-[9.5px] font-bold px-2 py-1 rounded"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="bg-red-50 text-red-650 hover:bg-red-100 text-[9.5px] font-bold px-2 py-1.5 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-lg border border-slate-200">
          <DialogTitle className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-[#F97316]" /> Upload Departure Document
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-450 mt-1">
            Specify the document type, name, storage path URL, and description details.
          </DialogDescription>
          <form onSubmit={handleUploadSubmit} className="space-y-4 mt-3">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Document Category</label>
              <select
                value={docForm.category}
                onChange={e => setDocForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
              >
                <option value="HOTEL_VOUCHER">Hotel Voucher</option>
                <option value="VEHICLE">Vehicle Document (Permits, RC)</option>
                <option value="GUIDE_ID">Guide ID Card / License</option>
                <option value="PASSENGER">Passenger Document (ID proof)</option>
                <option value="PAYMENT_PROOF">Client Payment Proof</option>
                <option value="OPERATIONAL">Other Operational File</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Document Title/Name</label>
              <input
                type="text"
                required
                value={docForm.originalFileName}
                onChange={e => setDocForm(prev => ({ ...prev, originalFileName: e.target.value }))}
                placeholder="e.g. Hotel Voucher Shimla.pdf"
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">File URL / Storage Link</label>
              <input
                type="url"
                required
                value={docForm.fileUrl}
                onChange={e => setDocForm(prev => ({ ...prev, fileUrl: e.target.value }))}
                placeholder="e.g. https://supabase-storage-bucket/vouchers/file.pdf"
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2.5 bg-white text-slate-700 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Remarks / Notes</label>
              <textarea
                rows={2}
                value={docForm.remarks}
                onChange={e => setDocForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Enter remarks or specifications..."
                className="w-full text-xs font-bold border border-slate-200 rounded p-2 bg-white text-slate-700 outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setUploadModalOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                Cancel
              </Button>
              <Button type="submit" disabled={uploading} className="h-8 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase rounded">
                {uploading ? "Saving Document..." : "Save Upload"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent className="max-w-md bg-white p-5 rounded-lg border border-slate-200">
          <DialogTitle className="text-sm font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4.5 h-4.5 text-blue-650" /> Verify Departure Document
          </DialogTitle>
          <DialogDescription className="text-[11px] text-slate-450 mt-1">
            Change the audit verification status and submit optional review comments.
          </DialogDescription>
          <form onSubmit={handleVerifySubmit} className="space-y-4 mt-3">
            <p className="text-xs text-slate-500 font-medium">Verify file: <strong className="text-slate-700">{selectedDoc?.originalFileName}</strong></p>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Verification Status</label>
              <select
                value={verifyForm.status}
                onChange={e => setVerifyForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full h-9 text-xs font-bold border border-slate-200 rounded px-2 bg-white text-slate-700 outline-none hover:bg-slate-50 cursor-pointer"
              >
                <option value="Pending">Pending Verification</option>
                <option value="Verified">Verified (Accept)</option>
                <option value="Rejected">Rejected (Decline)</option>
                <option value="Action Required">Action Required</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Review Remarks</label>
              <textarea
                rows={3}
                required
                value={verifyForm.remarks}
                onChange={e => setVerifyForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Log reason for rejection or verify remarks..."
                className="w-full text-xs font-bold border border-slate-200 rounded p-2 bg-white text-slate-700 outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => setVerifyModalOpen(false)} className="h-8 text-xs font-bold text-slate-500 rounded">
                Cancel
              </Button>
              <Button type="submit" className="h-8 bg-[#F97316] hover:bg-[#E05E00] text-white font-bold text-xs uppercase rounded">
                Submit Review
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
