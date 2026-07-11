import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Megaphone, Plus, ExternalLink, RefreshCw, Eye, Sparkles, 
  TrendingUp, BarChart3, Users, CreditCard, Play, FileText, 
  MapPin, Calendar, Clock, ChevronDown, CheckCircle2, XCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { marketingService, Campaign } from "@/services/marketing.service";

export default function MarketingOverviewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState("MKA");
  const [selectedSeason, setSelectedSeason] = useState("monsoon_2026");
  const [data, setData] = useState<any>(null);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const res = await marketingService.getOverview(selectedTrip);
      setData(res);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load marketing overview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [selectedTrip, selectedSeason]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  // Format currency helper
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="p-6 space-y-6 font-sans bg-[#F8FAFC] min-h-screen text-[#1E293B]">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Marketing</span>
            <span>&gt;</span>
            <span>Trips</span>
            <span>&gt;</span>
            <span className="text-slate-800">Manali Kasol Amritsar (MKA)</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">Manali Kasol Amritsar (MKA)</h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold text-xs px-2.5 py-0.5 rounded-full">Active</Badge>
          </div>
          <p className="text-xs text-slate-500 font-medium">Duration: 9 Days / 8 Nights | Group Trip | Seasons: Summer (Mar-Jun), Monsoon (Jul-Sep), Diwali (Oct-Nov), Winter (Dec-Feb)</p>
        </div>

        {/* Filter Selects */}
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <div className="w-[160px]">
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="bg-white border-slate-200 h-9 rounded-lg text-xs font-semibold text-slate-700">
                <SelectValue placeholder="Select Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monsoon_2026">Monsoon 2026 (Jul - Sep)</SelectItem>
                <SelectItem value="summer_2026">Summer 2026</SelectItem>
                <SelectItem value="diwali_2026">Diwali 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-[180px]">
            <Select defaultValue="july_sept">
              <SelectTrigger className="bg-white border-slate-200 h-9 rounded-lg text-xs font-semibold text-slate-700">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="july_sept">1 Jul 2025 - 30 Sep 2026</SelectItem>
                <SelectItem value="last_30">Last 30 Days</SelectItem>
                <SelectItem value="last_90">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Spend */}
        <Card className="bg-white shadow-xs border-slate-100 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Spend</span>
              <CreditCard className="w-4 h-4 text-blue-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xl font-bold tracking-tight">{formatCurrency(data.spend)}</h3>
              <p className="text-[9px] text-rose-600 font-semibold flex items-center gap-0.5">
                <span>vs Last Season</span>
                <span>-8.4%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card className="bg-white shadow-xs border-slate-100 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Leads Generated</span>
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xl font-bold tracking-tight">{data.leads.toLocaleString()}</h3>
              <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <span>vs Last Season</span>
                <span>+12.2%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="bg-white shadow-xs border-slate-100 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Confirmed Bookings</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xl font-bold tracking-tight">{data.bookings}</h3>
              <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <span>vs Last Season</span>
                <span>+15.6%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="bg-white shadow-xs border-slate-100 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Revenue Generated</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xl font-bold tracking-tight">{formatCurrency(data.revenue)}</h3>
              <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <span>vs Last Season</span>
                <span>+18.7%</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ROAS */}
        <Card className="bg-white shadow-xs border-slate-100 rounded-xl">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">ROAS</span>
              <BarChart3 className="w-4 h-4 text-[#FF6B00]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xl font-bold tracking-tight text-emerald-600">{data.roas.toFixed(2)}x</h3>
              <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <span>vs Last Season</span>
                <span>+2.1x</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-slate-500 font-medium">
        <div className="flex items-center gap-2">
          <span>All numbers are auto-calculated from connected data (Meta Ads, Leads, Bookings & Payments).</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Last synced: Today, 10:30 AM</span>
          <Button variant="ghost" size="icon" onClick={fetchOverviewData} className="w-6 h-6 text-slate-600 hover:text-[#FF6B00] hover:bg-white rounded-full">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Grid: Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Campaign Journal */}
          <Card className="bg-white border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">Campaign Journal (This Season)</CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">All campaigns for Monsoon 2026</p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 border-y border-slate-100">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 px-5">Campaign Name</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10">Period</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10">Platform</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 text-right">Spend</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 text-right">Leads</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 text-right">Bookings</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 text-right">Revenue</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 text-right">ROAS</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 text-center">Status</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider h-10 text-center px-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.campaigns.map((camp: Campaign) => (
                    <TableRow key={camp.id} className="hover:bg-slate-50/30 border-b border-slate-100/50">
                      <TableCell className="font-semibold text-slate-800 text-xs px-5 h-12">{camp.name}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{camp.period}</TableCell>
                      <TableCell className="text-slate-700 text-xs flex items-center gap-1.5 h-12">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1877F2] flex items-center justify-center text-[10px] font-black font-mono">∞</span>
                        <span>{camp.platform}</span>
                      </TableCell>
                      <TableCell className="text-slate-700 text-xs text-right font-medium">{formatCurrency(camp.spend)}</TableCell>
                      <TableCell className="text-slate-700 text-xs text-right">{camp.leads.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-700 text-xs text-right">{camp.bookings}</TableCell>
                      <TableCell className="text-slate-700 text-xs text-right font-medium">{formatCurrency(camp.revenue)}</TableCell>
                      <TableCell className="text-emerald-600 text-xs text-right font-bold">{camp.roas.toFixed(2)}x</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                          camp.status === 'Active' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {camp.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center px-5">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/admin/marketing/learnings`)} 
                            className="w-7 h-7 text-slate-400 hover:text-[#FF6B00] hover:bg-slate-50 rounded-lg"
                            title="View Learnings"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate(`/admin/marketing/assets`)} 
                            className="w-7 h-7 text-slate-400 hover:text-[#FF6B00] hover:bg-slate-50 rounded-lg"
                            title="View Assets"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t border-slate-100 bg-slate-50/20 flex justify-start">
                <Button variant="outline" onClick={() => navigate("/admin/marketing/campaigns")} className="text-xs h-8 font-semibold border-slate-200 text-slate-700 rounded-lg px-4 bg-white shadow-xs">
                  View All Campaigns
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Grid: Top Creatives & Recent Learnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Performing Creatives */}
            <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Top Performing Creatives</h3>
                  <p className="text-xs text-slate-500 font-medium">Based on leads generated</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {data.bestCreatives.map((creative: any, idx: number) => (
                  <div key={creative.id} className="group relative rounded-xl border border-slate-100 bg-slate-50 p-2 overflow-hidden flex flex-col justify-between hover:border-slate-200 transition-all">
                    {/* Media Thumbnail Mock */}
                    <div className="relative aspect-video rounded-lg bg-slate-800 flex items-center justify-center text-white overflow-hidden shadow-inner mb-2.5">
                      <div className="absolute inset-0 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&auto=format&fit=crop')] opacity-60"></div>
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-md bg-[#FF6B00] text-white font-extrabold text-[9px] flex items-center justify-center shadow-sm z-10">{idx + 1}</div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300 relative z-10 border border-white/30 cursor-pointer">
                        <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                      </div>
                      <div className="absolute bottom-1 right-1.5 px-1 py-0.2 bg-black/60 text-[8px] text-white rounded font-bold">0:20</div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-slate-800 truncate">{creative.name}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Leads: <strong>{creative.leads}</strong></span>
                        <span>Bookings: <strong className="text-slate-800">{creative.bookings}</strong></span>
                      </div>
                    </div>
                    <Button variant="ghost" className="w-full text-center text-[#FF6B00] hover:text-[#e05e00] font-bold text-[9px] uppercase tracking-wider h-6 mt-2 hover:bg-orange-50 rounded-lg p-0">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100/80 mt-5 pt-4 flex">
                <Button variant="link" onClick={() => navigate("/admin/marketing/assets")} className="text-xs text-[#FF6B00] font-bold hover:no-underline p-0 h-auto flex items-center gap-1">
                  View All Creatives <span className="text-xs font-semibold">&rarr;</span>
                </Button>
              </div>
            </Card>

            {/* Recent Learnings */}
            <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-0.5">Recent Learnings (This Season)</h3>
                <p className="text-xs text-slate-500 font-medium mb-4">Key insights from campaigns</p>
                <ul className="space-y-3">
                  {data.recentLearnings.map((learn: string, idx: number) => (
                    <li key={idx} className="flex gap-2.5 items-start text-xs font-medium text-slate-700 leading-relaxed">
                      <span className="w-4 h-4 mt-0.5 rounded-full bg-emerald-50 text-emerald-600 flex-shrink-0 flex items-center justify-center font-bold text-[9px]">✓</span>
                      <span>{learn}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-slate-100/80 mt-5 pt-4 flex">
                <Button variant="link" onClick={() => navigate("/admin/marketing/learnings")} className="text-xs text-[#FF6B00] font-bold hover:no-underline p-0 h-auto flex items-center gap-1">
                  View All Learnings <span className="text-xs font-semibold">&rarr;</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Sidebar (1 column) */}
        <div className="space-y-6">
          {/* Trip Summary */}
          <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Trip Summary</h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center text-xs font-medium border-b border-slate-50 pb-2.5">
                <span className="text-slate-500">Trip Code</span>
                <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">MKA</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium border-b border-slate-50 pb-2.5">
                <span className="text-slate-500">Base Price (Per Person)</span>
                <span className="font-bold text-slate-800">₹14,000</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium border-b border-slate-50 pb-2.5">
                <span className="text-slate-500">Target Group Size</span>
                <span className="font-bold text-slate-800">15 - 35 Pax</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium border-b border-slate-50 pb-2.5">
                <span className="text-slate-500">Trip Status</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold text-[10px] px-2 py-0">Active</Badge>
              </div>
              <div className="flex justify-between items-center text-xs font-medium pb-1">
                <span className="text-slate-500">Created On</span>
                <span className="font-bold text-slate-800">12 Jan 2024</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button onClick={() => navigate("/admin/marketing/campaigns")} className="w-full justify-start h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100 text-xs font-semibold rounded-xl gap-2 shadow-none">
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Create New Campaign</span>
              </Button>
              <Button onClick={() => navigate("/admin/marketing/content-studio")} className="w-full justify-start h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100 text-xs font-semibold rounded-xl gap-2 shadow-none">
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <span>View Content Studio</span>
              </Button>
              <Button onClick={() => navigate("/admin/marketing/assets")} className="w-full justify-start h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100 text-xs font-semibold rounded-xl gap-2 shadow-none">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Media Library</span>
              </Button>
              <Button onClick={() => navigate("/admin/trips")} className="w-full justify-start h-9 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-100 text-xs font-semibold rounded-xl gap-2 shadow-none">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>View Trip Details</span>
              </Button>
            </div>
          </Card>

          {/* Season Performance Sparklines */}
          <Card className="bg-white border-slate-100 rounded-2xl shadow-xs p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Season Performance (vs last season)</h3>
            <div className="space-y-4">
              {/* Spend */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">Spend</span>
                  <span className="font-semibold text-rose-600">-8.4%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              {/* Leads */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">Leads</span>
                  <span className="font-semibold text-emerald-600">+12.2%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              {/* Bookings */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">Bookings</span>
                  <span className="font-semibold text-emerald-600">+15.6%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
              {/* Revenue */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">Revenue</span>
                  <span className="font-semibold text-emerald-600">+18.7%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              {/* ROAS */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500">ROAS</span>
                  <span className="font-semibold text-emerald-600">+2.1x</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }}></div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
