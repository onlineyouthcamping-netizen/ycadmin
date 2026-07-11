import React, { useEffect, useState } from "react";
import { 
  FileText, Image as ImageIcon, Video, Music, ExternalLink, 
  MoreVertical, RefreshCw, Folder, Grid, List, ChevronRight 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { marketingService, Asset } from "@/services/marketing.service";

export default function AssetsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [assets, setAssets] = useState<Asset[]>([]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const data = await marketingService.getAssets();
      setAssets(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load campaign assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case "image":
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case "video":
        return <Video className="w-4 h-4 text-purple-600" />;
      case "document":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "audio":
        return <Music className="w-4 h-4 text-rose-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getPillForType = (type: string) => {
    switch (type.toLowerCase()) {
      case "image":
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
      case "video":
        return "bg-purple-50 text-purple-700 border border-purple-100";
      case "document":
        return "bg-blue-50 text-blue-700 border border-blue-100";
      case "audio":
        return "bg-rose-50 text-rose-700 border border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 font-sans bg-[#F8FAFC] min-h-screen text-[#1E293B]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Marketing</span>
            <span>&gt;</span>
            <span>Assets</span>
            <span>&gt;</span>
            <span className="text-slate-800">MKA Monsoon Campaign 2</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Assets</h1>
          <p className="text-xs text-slate-500 font-medium">
            Trip: Manali Kasol Amritsar (MKA) | Season: Monsoon 2026 | Platform: Meta (Facebook + Instagram) | Campaign: MKA Monsoon Campaign 2
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchAssets} size="icon" className="w-9 h-9 border-slate-200 text-slate-600 hover:text-[#FF6B00] hover:bg-white rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="h-9 text-xs font-bold border-[#FF6B00]/40 text-[#FF6B00] hover:text-[#e05e00] hover:bg-orange-50 bg-white rounded-xl px-4 shadow-2xs gap-1.5">
            <ExternalLink className="w-4 h-4" />
            <span>Open in Google Drive</span>
          </Button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 relative ${
            activeTab === "all" ? "text-[#FF6B00]" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          All Assets
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF6B00]"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("folder")}
          className={`pb-3 relative ${
            activeTab === "folder" ? "text-[#FF6B00]" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          By Folder
          {activeTab === "folder" && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF6B00]"></span>
          )}
        </button>
      </div>

      {activeTab === "all" ? (
        <Card className="bg-white border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50 border-y border-slate-100">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 px-5 w-[40%]">Asset Name</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 w-[15%]">Type</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 w-[30%]">Google Drive Link</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 w-[15%]">Added On</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 text-center px-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50/30 border-b border-slate-100/50">
                    {/* Name + Media Thumbnail Preview Mock */}
                    <TableCell className="px-5 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-150 flex items-center justify-center flex-shrink-0 shadow-2xs overflow-hidden">
                        {asset.type.toLowerCase() === 'image' ? (
                          <img 
                            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&auto=format&fit=crop" 
                            alt={asset.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : asset.type.toLowerCase() === 'video' ? (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                            <Video className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : (
                          getIconForType(asset.type)
                        )}
                      </div>
                      <span className="font-bold text-xs text-slate-800 leading-snug truncate max-w-[280px]">
                        {asset.name}
                      </span>
                    </TableCell>

                    {/* Type Badges */}
                    <TableCell className="py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getPillForType(asset.type)}`}>
                        {asset.type}
                      </span>
                    </TableCell>

                    {/* Drive Link */}
                    <TableCell className="py-3">
                      <a 
                        href={`https://${asset.link}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-500 hover:text-blue-700 font-semibold text-xs inline-flex items-center gap-1 hover:underline"
                      >
                        <span>{asset.link}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </TableCell>

                    {/* Added On */}
                    <TableCell className="text-slate-500 text-xs py-3 font-medium">
                      {asset.addedOn}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center py-3 px-5">
                      <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-slate-100 bg-slate-50/10 flex justify-center text-xs text-slate-400 font-bold tracking-tight">
              That's all your assets for this campaign.
            </div>
          </div>
        </Card>
      ) : (
        /* Folders view placeholder */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Images & Creatives", count: 3 },
            { name: "Video Materials", count: 2 },
            { name: "Copywriting & Briefs", count: 3 },
            { name: "Voiceovers & Audio", count: 1 },
          ].map((folder, idx) => (
            <Card key={idx} className="bg-white border-slate-100 hover:border-slate-200 transition-all rounded-2xl shadow-2xs group cursor-pointer p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center">
                  <Folder className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 truncate max-w-[140px]">{folder.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">{folder.count} files</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
