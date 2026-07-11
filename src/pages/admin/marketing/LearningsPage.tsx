import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle2, XCircle, Lightbulb, Play, AlertCircle, Sparkles,
  ChevronRight, Download, Edit, RefreshCw, ExternalLink, HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { marketingService, Learning } from "@/services/marketing.service";

export default function LearningsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState("campaign_2");
  const [data, setData] = useState<Learning | null>(null);

  const fetchLearnings = async () => {
    setLoading(true);
    try {
      const res = await marketingService.getLearnings(selectedCampaign);
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load campaign learnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearnings();
  }, [selectedCampaign]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  const { campaignInfo, metrics } = data;

  return (
    <div className="p-6 space-y-6 font-sans bg-[#F8FAFC] min-h-screen text-[#1E293B]">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Marketing</span>
            <span>&gt;</span>
            <span>Learnings</span>
            <span>&gt;</span>
            <span className="text-slate-800">{campaignInfo.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{campaignInfo.name}</h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs px-2.5 py-0.5 rounded-full">{campaignInfo.status}</Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Trip: Manali Kasol Amritsar (MKA) | Season: Monsoon 2026 | Platform: Meta (Facebook + Instagram) | Campaign Period: {campaignInfo.startDate} - {campaignInfo.endDate}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 text-xs font-semibold border-slate-200 text-slate-700 bg-white rounded-xl px-4 shadow-2xs gap-1.5">
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Learning</span>
          </Button>
          <Button className="bg-[#FF6B00] text-white hover:bg-[#e05e00] h-9 text-xs font-bold rounded-xl px-4 shadow-2xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Metrics Grid (6 columns) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Spend */}
        <Card className="bg-white border-slate-100 shadow-2xs rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spend</span>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-800">{formatCurrency(metrics.spend)}</h4>
              <p className="text-[9px] text-rose-600 font-semibold">{metrics.spendChange}% vs Last Campaign</p>
            </div>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card className="bg-white border-slate-100 shadow-2xs rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads Generated</span>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-800">{metrics.leads.toLocaleString()}</h4>
              <p className="text-[9px] text-emerald-600 font-semibold">+{metrics.leadsChange}% vs Last Campaign</p>
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="bg-white border-slate-100 shadow-2xs rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bookings</span>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-800">{metrics.bookings}</h4>
              <p className="text-[9px] text-emerald-600 font-semibold">+{metrics.bookingsChange}% vs Last Campaign</p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="bg-white border-slate-100 shadow-2xs rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue Generated</span>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-800">{formatCurrency(metrics.revenue)}</h4>
              <p className="text-[9px] text-emerald-600 font-semibold">+{metrics.revenueChange}% vs Last Campaign</p>
            </div>
          </CardContent>
        </Card>

        {/* ROAS */}
        <Card className="bg-white border-slate-100 shadow-2xs rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ROAS</span>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-emerald-600">{metrics.roas.toFixed(2)}x</h4>
              <p className="text-[9px] text-emerald-600 font-semibold">+{metrics.roasChange}x vs Last Campaign</p>
            </div>
          </CardContent>
        </Card>

        {/* Cost per Booking */}
        <Card className="bg-white border-slate-100 shadow-2xs rounded-xl">
          <CardContent className="p-3.5 flex flex-col justify-between h-20">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cost per Booking</span>
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-slate-800">{formatCurrency(metrics.costPerBooking)}</h4>
              <p className="text-[9px] text-emerald-600 font-semibold">{metrics.costPerBookingChange}% vs Last Campaign</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side Details (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tri-fold Feedback Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* What Worked Well */}
            <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">What Worked Well</h3>
              </div>
              <ul className="space-y-3">
                {data.whatWorked.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs font-medium text-slate-700 leading-relaxed">
                    <span className="w-4 h-4 mt-0.5 rounded-full bg-emerald-50 text-emerald-600 flex-shrink-0 flex items-center justify-center font-bold text-[9px]">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* What Didn't Work */}
            <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2.5">
                <XCircle className="w-4 h-4 text-rose-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">What Didn't Work</h3>
              </div>
              <ul className="space-y-3">
                {data.whatDidntWork.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs font-medium text-slate-700 leading-relaxed">
                    <span className="w-4 h-4 mt-0.5 rounded-full bg-rose-50 text-rose-600 flex-shrink-0 flex items-center justify-center font-bold text-[9px] font-mono">x</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Ideas for Next Season */}
            <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-2.5">
                <Lightbulb className="w-4 h-4 text-[#FF6B00]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Ideas for Next Season</h3>
              </div>
              <ul className="space-y-3">
                {data.ideasNextSeason.map((item, idx) => (
                  <li key={idx} className="flex gap-2.5 items-start text-xs font-medium text-slate-700 leading-relaxed">
                    <span className="w-4 h-4 mt-0.5 rounded-full bg-orange-50 text-[#FF6B00] flex-shrink-0 flex items-center justify-center font-bold text-[9px]">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Competitor Observations */}
          <Card className="bg-white border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>Competitor Observations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 border-y border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 px-5 w-[20%]">Competitor</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 w-[25%]">Observation</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 w-[25%]">What They Did</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 w-[15%] text-center">Should We Try?</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 px-5">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.competitorObservations.map((obs, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/30 border-b border-slate-100/50">
                      <TableCell className="font-bold text-slate-800 text-xs px-5 h-12">{obs.competitor}</TableCell>
                      <TableCell className="text-slate-600 text-xs font-medium">{obs.observation}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{obs.whatTheyDid}</TableCell>
                      <TableCell className="text-center py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          obs.shouldTry === 'Yes' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          obs.shouldTry === 'Maybe' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {obs.shouldTry}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs font-medium px-5">{obs.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bottom Grid: Important Notes & AI Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Important Notes */}
            <Card className="bg-amber-50/30 border border-amber-100 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
                <span>Important Notes</span>
              </h3>
              <ul className="space-y-2.5">
                {data.importantNotes.map((note, idx) => (
                  <li key={idx} className="flex gap-2 items-start text-xs font-semibold text-slate-700">
                    <span className="text-[#F59E0B] flex-shrink-0 mt-0.5">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* AI Suggestions */}
            <Card className="bg-purple-50/20 border border-purple-100 rounded-2xl p-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                  <span>AI Suggestions (Beta)</span>
                </h3>
                <ul className="space-y-2.5">
                  {data.aiSuggestions.map((sug, idx) => (
                    <li key={idx} className="flex gap-2 items-start text-xs font-semibold text-slate-700">
                      <span className="text-[#8B5CF6] flex-shrink-0 mt-0.5">•</span>
                      <span>{sug}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-5 pt-3">
                <Button className="bg-[#8B5CF6] text-white hover:bg-[#7c4dff] text-xs font-bold rounded-xl h-8 px-4 w-fit">
                  Learn More
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Sidebar (1 column) */}
        <div className="space-y-6">
          {/* Campaign Info */}
          <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Campaign Info</h3>
            <div className="space-y-3">
              {[
                { label: "Campaign Name", val: campaignInfo.name },
                { label: "Objective", val: campaignInfo.objective },
                { label: "Buying Type", val: campaignInfo.buyingType },
                { label: "Budget", val: campaignInfo.budget },
                { label: "Start Date", val: campaignInfo.startDate },
                { label: "End Date", val: campaignInfo.endDate },
                { label: "Campaign Status", val: campaignInfo.status },
                { label: "Created By", val: campaignInfo.createdBy },
                { label: "Created On", val: campaignInfo.createdOn },
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-medium border-b border-slate-50/50 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-bold text-slate-800">{item.val}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Attached Drive Links */}
          <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Attached Drive Links</h3>
            <div className="space-y-3">
              {[
                { name: "Creatives Folder", type: "Folder", link: data.driveLinks.creatives },
                { name: "Ad Copies", type: "Document", link: data.driveLinks.adCopies },
                { name: "Raw Videos", type: "Folder", link: data.driveLinks.rawVideos },
                { name: "Thumbnails", type: "Folder", link: data.driveLinks.thumbnails },
                { name: "Screenshots", type: "Folder", link: data.driveLinks.screenshots },
              ].map((link, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs font-medium border-b border-slate-50/50 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block flex-shrink-0"></span>
                    <span>{link.name} (Drive)</span>
                  </span>
                  <a href={link.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 flex items-center">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 mt-4 pt-3">
              <Button variant="outline" className="w-full h-8 text-[11px] font-bold border-slate-200 text-slate-700 rounded-xl bg-white shadow-2xs">
                Open All Links
              </Button>
            </div>
          </Card>

          {/* Best Performing Creatives */}
          <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Best Performing Creatives</h3>
            <div className="space-y-3">
              {data.bestCreatives.map((creative) => (
                <div key={creative.id} className="flex justify-between items-center text-xs font-semibold border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 text-white relative shadow-sm cursor-pointer">
                      <Play className="w-2.5 h-2.5 fill-white text-white translate-x-0.5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-bold text-slate-800 truncate text-xs">{creative.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Leads: {creative.leads}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{creative.bookings}</span>
                    <p className="text-[8px] text-slate-400 font-bold uppercase">Bookings</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 mt-4 pt-3">
              <Button variant="link" onClick={() => navigate("/admin/marketing/assets")} className="text-xs text-[#FF6B00] font-bold hover:no-underline p-0 h-auto w-full text-center">
                View All Creatives &rarr;
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
