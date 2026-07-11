import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Megaphone, Plus, Eye, ExternalLink, Calendar, Users, 
  CreditCard, TrendingUp, RefreshCw, BarChart3, HelpCircle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { marketingService, Campaign } from "@/services/marketing.service";

export default function CampaignJournalPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await marketingService.getCampaigns();
      setCampaigns(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load campaigns list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  // Summary Metrics
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.leads, 0);
  const totalBookings = campaigns.reduce((sum, c) => sum + c.bookings, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
  const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return (
    <div className="p-6 space-y-6 font-sans bg-[#F8FAFC] min-h-screen text-[#1E293B]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Marketing</span>
            <span>&gt;</span>
            <span className="text-slate-800">Campaigns</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Campaigns Journal</h1>
          <p className="text-xs text-slate-500 font-medium">Detailed log of marketing campaigns and financial performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchCampaigns} variant="outline" size="icon" className="w-9 h-9 border-slate-200 text-slate-600 hover:text-[#FF6B00] hover:bg-white rounded-xl">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button className="bg-[#FF6B00] text-white hover:bg-[#e05e00] text-xs font-bold rounded-xl h-9 px-4 gap-2">
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Campaigns */}
        <Card className="bg-white border-slate-100 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between h-20">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campaigns Run</span>
              <h3 className="text-xl font-bold tracking-tight text-slate-800">{campaigns.length}</h3>
              <p className="text-[9px] text-[#FF6B00] font-semibold">1 Currently Active</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF6B00]">
              <Megaphone className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Spend */}
        <Card className="bg-white border-slate-100 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between h-20">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spend</span>
              <h3 className="text-xl font-bold tracking-tight text-slate-800">{formatCurrency(totalSpend)}</h3>
              <p className="text-[9px] text-slate-400 font-semibold">Meta ads dashboard</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Leads */}
        <Card className="bg-white border-slate-100 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between h-20">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leads</span>
              <h3 className="text-xl font-bold tracking-tight text-slate-800">{totalLeads.toLocaleString()}</h3>
              <p className="text-[9px] text-emerald-500 font-semibold">Avg CPL: ₹1,120</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card className="bg-white border-slate-100 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between h-20">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bookings</span>
              <h3 className="text-xl font-bold tracking-tight text-slate-800">{totalBookings}</h3>
              <p className="text-[9px] text-emerald-500 font-semibold">Conv. Rate: {(totalBookings/totalLeads*100).toFixed(2)}%</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* ROAS */}
        <Card className="bg-white border-slate-100 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center justify-between h-20">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall ROAS</span>
              <h3 className="text-xl font-bold tracking-tight text-emerald-600">{overallRoas.toFixed(2)}x</h3>
              <p className="text-[9px] text-emerald-500 font-semibold">Total: {formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-white border-slate-100 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-800">All Campaigns</CardTitle>
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
              {campaigns.map((camp) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
