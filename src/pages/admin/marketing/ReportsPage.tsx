import React, { useEffect, useState } from "react";
import { 
  BarChart3, RefreshCw, Download, ChevronRight, Sun, 
  CloudRain, Sparkles, Snowflake, ArrowUpRight, TrendingUp, Info, Calendar
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { marketingService, Report } from "@/services/marketing.service";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("season");
  const [reports, setReports] = useState<Report[]>([]);

  // Filter States
  const [selectedTrip, setSelectedTrip] = useState("MKA");
  const [selectedSeason, setSelectedSeason] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("meta");

  // Comparison States
  const [compareSeasonA, setCompareSeasonA] = useState("Summer 2025");
  const [compareSeasonB, setCompareSeasonB] = useState("Monsoon 2025");
  const [comparisonResults, setComparisonResults] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await marketingService.getReports(selectedTrip);
      setReports(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedTrip]);

  const handleApplyFilters = () => {
    fetchReports();
    toast.success("Filters applied successfully");
  };

  const handleCompareSeasons = () => {
    const seasonA = reports.find(r => r.season === compareSeasonA);
    const seasonB = reports.find(r => r.season === compareSeasonB);
    
    if (seasonA && seasonB) {
      const roasDiff = seasonA.roas - seasonB.roas;
      const revDiff = seasonA.revenue - seasonB.revenue;
      
      const statement = `${seasonA.season} (${seasonA.roas}x ROAS) has a ${
        roasDiff >= 0 ? "higher" : "lower"
      } return on ad spend than ${seasonB.season} (${seasonB.roas}x ROAS) by ${Math.abs(roasDiff).toFixed(2)}x. Revenue difference is ${
        revDiff >= 0 ? "+" : ""
      }${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(revDiff)}.`;
      
      setComparisonResults(statement);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getSeasonIcon = (iconName: string) => {
    switch (iconName) {
      case "sun":
        return <Sun className="w-4 h-4 text-amber-500 fill-amber-155" />;
      case "cloud-rain":
        return <CloudRain className="w-4 h-4 text-blue-500" />;
      case "sparkles":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case "snowflake":
        return <Snowflake className="w-4 h-4 text-cyan-500" />;
      default:
        return <Sun className="w-4 h-4 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#FF6B00]"></div>
      </div>
    );
  }

  // Totals calculations
  const totalCampaigns = reports.reduce((sum, r) => sum + r.campaigns, 0);
  const totalSpend = reports.reduce((sum, r) => sum + r.spend, 0);
  const totalLeads = reports.reduce((sum, r) => sum + r.leads, 0);
  const totalBookings = reports.reduce((sum, r) => sum + r.bookings, 0);
  const totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0);
  const totalRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalCostPerBooking = totalBookings > 0 ? totalSpend / totalBookings : 0;
  const totalConvRate = totalLeads > 0 ? (totalBookings / totalLeads) * 100 : 0;

  return (
    <div className="p-6 space-y-6 font-sans bg-[#F8FAFC] min-h-screen text-[#1E293B] -mx-6 -my-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#E2E8F0] pb-4 bg-white -mx-6 -mt-6 p-6 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>Marketing</span>
            <span>&gt;</span>
            <span className="text-slate-800">Reports</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Reports</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Compare campaign performance across seasons and time periods.</p>
        </div>
        <Button variant="outline" className="h-9 text-xs font-bold border-slate-200 text-slate-700 bg-white rounded-[4px] px-4 shadow-2xs gap-1.5 self-start">
          <Download className="w-4 h-4 text-slate-400" />
          <span>Export Report</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-4 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Trip */}
          <div className="space-y-1 text-xs font-semibold text-slate-700">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Trip</label>
            <Select value={selectedTrip} onValueChange={setSelectedTrip}>
              <SelectTrigger className="h-8.5 text-xs border-slate-200 rounded-[4px] bg-white text-slate-700 font-semibold shadow-none focus:ring-[#FF6B00]">
                <SelectValue placeholder="Trip" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MKA">Manali Kasol Amritsar (MKA)</SelectItem>
                <SelectItem value="SPT">Spiti Valley (SPT)</SelectItem>
                <SelectItem value="LAD">Leh Ladakh (LAD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Season */}
          <div className="space-y-1 text-xs font-semibold text-slate-700">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Season</label>
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="h-8.5 text-xs border-slate-200 rounded-[4px] bg-white text-slate-700 font-semibold shadow-none focus:ring-[#FF6B00]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Seasons</SelectItem>
                <SelectItem value="summer">Summer 2025</SelectItem>
                <SelectItem value="monsoon">Monsoon 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-1 text-xs font-semibold text-slate-700">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Date Range</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select defaultValue="full" className="w-full h-8.5 text-xs border border-slate-200 rounded-[4px] bg-white text-slate-700 font-semibold pl-8 pr-2 focus:ring-[#FF6B00]">
                <option value="full">1 Jan 2025 - 31 Dec 2026</option>
                <option value="last_30">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-1 text-xs font-semibold text-slate-700">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Platform</label>
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="h-8.5 text-xs border-slate-200 rounded-[4px] bg-white text-slate-700 font-semibold shadow-none focus:ring-[#FF6B00]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meta">Meta (Facebook + Instagram)</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={handleApplyFilters} className="bg-[#FF6B00] hover:bg-[#E56000] text-white h-8.5 text-xs font-bold rounded-[4px] flex-1 shadow-none transition-colors">
              Apply Filters
            </Button>
            <Button variant="ghost" onClick={() => { setSelectedTrip("MKA"); setSelectedSeason("all"); }} className="text-xs font-bold text-slate-400 hover:text-slate-600 h-8.5 px-3">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Tab Selectors */}
      <div className="border-b border-slate-200 flex gap-6 text-sm font-semibold pt-2">
        {[
          { key: "season", label: "Season Performance" },
          { key: "campaign", label: "Campaign Performance" },
          { key: "monthly", label: "Monthly Trend" },
          { key: "platform", label: "Platform Performance" },
          { key: "conversion", label: "Conversion Summary" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 relative text-xs tracking-wide ${
              activeTab === tab.key ? "text-[#FF6B00] font-bold" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF6B00]"></span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "season" ? (
        <>
          {/* Seasonal Performance Table */}
          <Card className="bg-white border-slate-200 rounded-[4px] shadow-none overflow-hidden">
            <div className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                  <TableRow>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 pl-5">Season</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">Duration</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">Campaigns</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">Spend (₹)</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">Leads</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">Bookings</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">Revenue (₹)</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">ROAS</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">Cost per Booking</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 text-right">Conversion Rate</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-3 pr-5 text-center"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((rep, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-55 border-b border-slate-100/50">
                      <TableCell className="pl-5 py-3 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {getSeasonIcon(rep.icon)}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-800">{rep.season}</h4>
                          <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{rep.period}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-slate-650 font-semibold text-xs py-3">{rep.duration}</TableCell>
                      <TableCell className="text-right text-slate-650 font-semibold text-xs py-3">{rep.campaigns}</TableCell>
                      <TableCell className="text-right text-slate-800 font-bold text-xs py-3">{formatCurrency(rep.spend)}</TableCell>
                      <TableCell className="text-right text-slate-650 text-xs py-3 font-semibold">{rep.leads.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-slate-650 text-xs py-3 font-semibold">{rep.bookings}</TableCell>
                      <TableCell className="text-right text-slate-800 font-bold text-xs py-3">{formatCurrency(rep.revenue)}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-extrabold text-xs py-3">{rep.roas.toFixed(2)}x</TableCell>
                      <TableCell className="text-right text-slate-800 font-semibold text-xs py-3">{formatCurrency(rep.costPerBooking)}</TableCell>
                      <TableCell className="text-right text-slate-800 font-semibold text-xs py-3">{rep.conversionRate.toFixed(2)}%</TableCell>
                      <TableCell className="text-center pr-5 py-3">
                        <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-400 hover:text-[#FF6B00] hover:bg-slate-50 rounded">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Totals Row */}
                  <TableRow className="bg-[#FFF8F2] hover:bg-[#FFF8F2] font-bold border-y border-orange-100">
                    <TableCell className="pl-5 py-3.5 text-slate-800 font-extrabold text-xs">Total (All Seasons)</TableCell>
                    <TableCell className="text-right text-slate-800 text-xs font-bold py-3.5">12</TableCell>
                    <TableCell className="text-right text-slate-800 text-xs font-bold py-3.5">{totalCampaigns}</TableCell>
                    <TableCell className="text-right text-slate-850 text-xs font-bold py-3.5">{formatCurrency(totalSpend)}</TableCell>
                    <TableCell className="text-right text-slate-800 text-xs font-bold py-3.5">{totalLeads.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-slate-800 text-xs font-bold py-3.5">{totalBookings}</TableCell>
                    <TableCell className="text-right text-slate-850 text-xs font-bold py-3.5">{formatCurrency(totalRevenue)}</TableCell>
                    <TableCell className="text-right text-[#FF6B00] text-xs font-bold py-3.5">{totalRoas.toFixed(2)}x</TableCell>
                    <TableCell className="text-right text-slate-800 text-xs font-bold py-3.5">{formatCurrency(totalCostPerBooking)}</TableCell>
                    <TableCell className="text-right text-slate-800 text-xs font-bold py-3.5">{totalConvRate.toFixed(2)}%</TableCell>
                    <TableCell className="pr-5 py-3.5"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Insights & Quick Compare Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Key Insights */}
            <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Insights</h3>
              <ul className="space-y-3">
                <li className="flex gap-2.5 items-start text-xs font-semibold text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-650 flex-shrink-0 flex items-center justify-center font-bold text-[9px] mt-0.5">✓</span>
                  <span>Summer 2025 had the highest number of bookings (248) and revenue ({formatCurrency(3462400)}).</span>
                </li>
                <li className="flex gap-2.5 items-start text-xs font-semibold text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-650 flex-shrink-0 flex items-center justify-center font-bold text-[9px] mt-0.5">✓</span>
                  <span>Best ROAS achieved in Summer 2025 (12.16x).</span>
                </li>
                <li className="flex gap-2.5 items-start text-xs font-semibold text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-650 flex-shrink-0 flex items-center justify-center font-bold text-[9px] mt-0.5">✓</span>
                  <span>Lowest Cost per Booking in Winter 2025-26 ({formatCurrency(122581)}).</span>
                </li>
                <li className="flex gap-2.5 items-start text-xs font-semibold text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-650 flex-shrink-0 flex items-center justify-center font-bold text-[9px] mt-0.5">✓</span>
                  <span>Overall conversion rate across all seasons is {totalConvRate.toFixed(2)}%.</span>
                </li>
              </ul>
            </Card>

            {/* Quick Compare Seasons */}
            <Card className="bg-white border-slate-200 rounded-[4px] shadow-none p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick Compare</h3>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Select two seasons to compare performance metrics directly.</p>
                <div className="flex items-center gap-2">
                  <Select value={compareSeasonA} onValueChange={setCompareSeasonA}>
                    <SelectTrigger className="h-8.5 text-xs border-slate-200 rounded-[4px] text-slate-700 font-semibold bg-white">
                      <SelectValue placeholder="Season A" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {reports.map((r, i) => (
                        <SelectItem key={i} value={r.season}>{r.season}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-[10px] text-slate-450 font-bold uppercase px-1">vs</span>

                  <Select value={compareSeasonB} onValueChange={setCompareSeasonB}>
                    <SelectTrigger className="h-8.5 text-xs border-slate-200 rounded-[4px] text-slate-700 font-semibold bg-white">
                      <SelectValue placeholder="Season B" />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {reports.map((r, i) => (
                        <SelectItem key={i} value={r.season}>{r.season}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={handleCompareSeasons} variant="outline" className="border-[#FF6B00]/40 text-[#FF6B00] hover:text-[#e05e00] hover:bg-orange-50 bg-white h-8.5 text-xs font-bold rounded-[4px] px-4 shadow-none">
                    Compare
                  </Button>
                </div>
                {comparisonResults && (
                  <div className="p-3 bg-slate-55 rounded text-xs font-semibold text-slate-700 border border-slate-100 leading-relaxed">
                    {comparisonResults}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Bottom Footer Details */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span>All data is automatically pulled from Meta Ads, Leads, Bookings & Payments.</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Last updated: Today, 10:30 AM</span>
              <Button variant="ghost" onClick={fetchReports} className="text-xs text-slate-650 hover:text-[#FF6B00] flex items-center gap-1.5 h-8 px-2 rounded">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[4px] p-20 text-center space-y-4 shadow-none">
          <BarChart3 className="w-10 h-10 text-[#FF6B00] mx-auto animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Chart Visualization Pending</h3>
          <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">This report tab is currently compiling advertising metrics.</p>
        </div>
      )}
    </div>
  );
}
