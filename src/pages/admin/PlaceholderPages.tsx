import { useState } from "react";
import { 
  LayoutGrid, Star, Share2, Users, 
  ArrowUpRight, Target, TrendingUp,
  Download, Filter, Calendar, Plus, Sparkles,
  Search, CheckCircle2, AlertCircle, Clock, Copy, Shield,
  CreditCard, Tag, RefreshCw, ChevronRight, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── COLLECTIONS PAGE ───
export function CollectionsPage() {
  const [collections] = useState([
    { id: "1", title: "Himalayan Expeditions", count: 12, slug: "himalayan-expeditions", status: "Active", banner: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600" },
    { id: "2", title: "Weekend Getaways & Treks", count: 8, slug: "weekend-getaways", status: "Active", banner: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=600" },
    { id: "3", title: "Spiti & Ladakh Circuit", count: 6, slug: "spiti-ladakh", status: "Active", banner: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600" },
    { id: "4", title: "South India Coastal & Hills", count: 5, slug: "south-india", status: "Active", banner: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600" },
  ]);

  return (
    <div className="space-y-6 p-6 sm:p-8 bg-slate-50/50 min-h-screen font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">Trip Collections & Categories</h1>
            <p className="text-xs font-semibold text-slate-500">Group travel itineraries into curated collections for public web discovery</p>
          </div>
        </div>
        <Button onClick={() => toast.success("New Collection modal ready")} className="h-10 px-5 rounded-xl font-extrabold text-xs bg-[#D4541A] hover:bg-[#c24813] text-white flex items-center gap-2 cursor-pointer shadow-md">
          <Plus className="w-4 h-4" /> Create Collection
        </Button>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Collections</p>
          <p className="text-2xl font-black text-[#0B1528] mt-1">4 Active</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Grouped Trips</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">31 Expeditions</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Homepage Showcase</p>
          <p className="text-2xl font-black text-[#D4541A] mt-1">Enabled</p>
        </div>
      </div>

      {/* Grid of collections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {collections.map(c => (
          <div key={c.id} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group">
            <div className="h-36 relative overflow-hidden">
              <img src={c.banner} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black text-emerald-700">
                {c.status}
              </div>
            </div>
            <div className="p-5 space-y-3">
              <h3 className="font-extrabold text-[#0B1528] text-sm leading-tight">{c.title}</h3>
              <p className="text-xs font-semibold text-slate-500">{c.count} Trips Linked</p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10.5px] font-mono text-slate-400">/{c.slug}</span>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-bold text-[#D4541A] hover:bg-orange-50">
                  Manage <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROMOTIONS & DISCOUNT CODES PAGE ───
export function PromotionsPage() {
  const [coupons] = useState([
    { code: "SUMMER2026", discount: "15% OFF", minBooking: "₹10,000", maxDiscount: "₹2,000", used: 42, status: "Active", expires: "31 Aug 2026" },
    { code: "EARLYBIRD", discount: "₹1,000 FLAT", minBooking: "₹12,000", maxDiscount: "₹1,000", used: 89, status: "Active", expires: "15 Sep 2026" },
    { code: "GROUPTREK", discount: "10% OFF", minBooking: "₹25,000", maxDiscount: "₹3,500", used: 18, status: "Active", expires: "31 Dec 2026" },
    { code: "FLAT500", discount: "₹500 FLAT", minBooking: "₹5,000", maxDiscount: "₹500", used: 124, status: "Expired", expires: "01 Jul 2026" },
  ]);

  return (
    <div className="space-y-6 p-6 sm:p-8 bg-slate-50/50 min-h-screen font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">Promotions & Coupons</h1>
            <p className="text-xs font-semibold text-slate-500">Manage promotional coupon codes, group discounts, and seasonal offers</p>
          </div>
        </div>
        <Button onClick={() => toast.success("New Coupon dialog ready")} className="h-10 px-5 rounded-xl font-extrabold text-xs bg-[#D4541A] hover:bg-[#c24813] text-white flex items-center gap-2 cursor-pointer shadow-md">
          <Plus className="w-4 h-4" /> Create Coupon Code
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Coupons</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">3 Live</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Redemptions</p>
          <p className="text-2xl font-black text-[#0B1528] mt-1">273 Bookings</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Discount Saved</p>
          <p className="text-2xl font-black text-[#D4541A] mt-1">₹3.42 Lakhs</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conversion Boost</p>
          <p className="text-2xl font-black text-blue-600 mt-1">+18.4%</p>
        </div>
      </div>

      {/* Coupon List Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-500">
            <tr>
              <th className="p-4">Coupon Code</th>
              <th className="p-4">Discount Value</th>
              <th className="p-4">Min Booking</th>
              <th className="p-4">Max Cap</th>
              <th className="p-4">Used Count</th>
              <th className="p-4">Expiry Date</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {coupons.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <span className="font-mono font-bold text-[#D4541A] bg-orange-50 border border-orange-200/80 px-2.5 py-1 rounded-lg">
                    {c.code}
                  </span>
                </td>
                <td className="p-4 font-black text-[#0B1528]">{c.discount}</td>
                <td className="p-4">{c.minBooking}</td>
                <td className="p-4">{c.maxDiscount}</td>
                <td className="p-4">{c.used} times</td>
                <td className="p-4 text-slate-500">{c.expires}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                    c.status === "Active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DISTRIBUTION & OTA MARKETPLACE PAGE ───
export function DistributionPage() {
  const [channels] = useState([
    { name: "Direct Website (YouthCamping.in)", type: "Owned Storefront", sync: "Real-time", commission: "0%", status: "Connected", leads: "1,240" },
    { name: "Thrillophilia Marketplace", type: "OTA Channel API", sync: "Auto-Sync 5m", commission: "12%", status: "Connected", leads: "480" },
    { name: "MakeMyTrip Holidays", type: "B2B Partner API", sync: "Auto-Sync 15m", commission: "15%", status: "Connected", leads: "310" },
    { name: "Tripoto Expeditions", type: "Content Partner", sync: "Manual Push", commission: "10%", status: "Pending Sync", leads: "95" },
  ]);

  return (
    <div className="space-y-6 p-6 sm:p-8 bg-slate-50/50 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">Distribution & OTA Channels</h1>
            <p className="text-xs font-semibold text-slate-500">Connect YouthCamping departure inventory with external travel marketplaces and OTAs</p>
          </div>
        </div>
        <Button onClick={() => toast.success("New Channel API modal ready")} className="h-10 px-5 rounded-xl font-extrabold text-xs bg-[#D4541A] hover:bg-[#c24813] text-white flex items-center gap-2 cursor-pointer shadow-md">
          <Plus className="w-4 h-4" /> Add OTA Channel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {channels.map((ch, i) => (
          <div key={i} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-[#0B1528] text-base">{ch.name}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{ch.type}</p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                ch.status === "Connected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {ch.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Sync Rate</span>
                <span className="font-bold text-slate-700">{ch.sync}</span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Commission</span>
                <span className="font-bold text-slate-700">{ch.commission}</span>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block">Leads Generated</span>
                <span className="font-black text-[#D4541A]">{ch.leads}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BILLING & SYSTEM SUBSCRIPTIONS PAGE ───
export function BillingPage() {
  return (
    <div className="space-y-6 p-6 sm:p-8 bg-slate-50/50 min-h-screen font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">Billing & ERP Subscriptions</h1>
            <p className="text-xs font-semibold text-slate-500">Manage YouthCamping OS infrastructure, WhatsApp API credits, and cloud server usage</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp & Email API</span>
          <h3 className="text-2xl font-black text-[#0B1528]">Brevo Pro API</h3>
          <p className="text-xs font-semibold text-slate-500">42,500 / 50,000 Messages Used This Month</p>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#D4541A] h-full rounded-full" style={{ width: "85%" }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cloud Image Storage</span>
          <h3 className="text-2xl font-black text-[#0B1528]">Cloudinary CDN</h3>
          <p className="text-xs font-semibold text-[#10B981]">14.2 GB / 50 GB Used (Active)</p>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className="bg-[#10B981] h-full rounded-full" style={{ width: "28%" }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Database & Hosting</span>
          <h3 className="text-2xl font-black text-[#0B1528]">PostgreSQL Cluster</h3>
          <p className="text-xs font-semibold text-slate-500">99.99% Uptime • SSL Verified</p>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Healthy
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PlaceholderPage({ title, description, icon: Icon }: { title: string, description: string, icon: any }) {
  return (
    <div className="p-8 space-y-6 font-sans">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#D4541A] flex items-center justify-center font-bold">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0B1528] tracking-tight">{title}</h1>
            <p className="text-xs font-semibold text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-4 shadow-xs">
        <div className="w-16 h-16 bg-orange-50 text-[#D4541A] rounded-2xl flex items-center justify-center mx-auto">
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-[#0B1528] uppercase tracking-tight">{title} Management Workspace</h3>
        <p className="text-xs font-semibold text-slate-500 max-w-md mx-auto">
          Configure settings, manage data records, and view real-time operations for {title.toLowerCase()}.
        </p>
      </div>
    </div>
  );
}
