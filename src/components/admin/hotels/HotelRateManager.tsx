import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Table, Upload, Plus, Copy, Save, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotelRateManagerProps {
  api: any;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function HotelRateManager({ api }: HotelRateManagerProps) {
  const [hotels, setHotels] = useState<any[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>("");
  const [destinations, setDestinations] = useState<any[]>([]);
  const [selectedDest, setSelectedDest] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pricingToggle, setPricingToggle] = useState<"per_room" | "per_pax">("per_room");

  useEffect(() => {
    // Mock or fetch initial dropdown data
    // Assuming /api/destinations works
    const init = async () => {
      try {
        const dRes = await api.get("/api/destinations");
        if (dRes.data?.data) setDestinations(dRes.data.data);
      } catch (err) {
        console.error("Failed to load destinations", err);
      }
    };
    init();
  }, [api]);

  const fetchRates = async () => {
    if (!selectedHotel) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/hotel-rates/${selectedHotel}?year=${year}`);
      if (res.data?.success) {
        // Map 1-12 array
        const fetchedRates = res.data.rates;
        const mapped = MONTHS.map((m, idx) => {
          const found = fetchedRates.find((r: any) => r.month === idx + 1);
          return found || {
            month: idx + 1,
            month_name: m,
            double_sharing_per_room: 0,
            double_sharing_per_pax: 0,
            triple_sharing_per_room: 0,
            triple_sharing_per_pax: 0,
            quad_sharing_per_room: 0,
            quad_sharing_per_pax: 0,
          };
        });
        setRates(mapped);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Initialize empty
        setRates(MONTHS.map((m, idx) => ({
          month: idx + 1,
          month_name: m,
          double_sharing_per_room: 0, double_sharing_per_pax: 0,
          triple_sharing_per_room: 0, triple_sharing_per_pax: 0,
          quad_sharing_per_room: 0, quad_sharing_per_pax: 0,
        })));
      } else {
        toast.error("Failed to fetch rates");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [selectedHotel, year]);

  const handleRateChange = (monthIdx: number, field: string, value: number) => {
    const newRates = [...rates];
    newRates[monthIdx] = { ...newRates[monthIdx], [field]: value };
    setRates(newRates);
  };

  const handleSaveAll = async () => {
    if (!selectedHotel || !selectedDest) return toast.error("Select hotel and destination");
    
    setLoading(true);
    try {
      const res = await api.post("/api/hotel-rates/create", {
        hotel_id: parseInt(selectedHotel),
        destination_id: parseInt(selectedDest),
        rates: rates.map(r => ({ ...r, year }))
      });
      if (res.data?.success) {
        toast.success(`Saved rates for ${res.data.created_count} months!`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save rates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Hotel Rate Manager</h2>
          <p className="text-sm text-slate-500">Manage seasonal pricing matrix for hotels</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="text-sm">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleSaveAll} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-100">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Destination ID</label>
          <input 
            type="number"
            className="w-40 h-9 px-3 text-sm border border-slate-200 rounded-md"
            value={selectedDest}
            onChange={(e) => setSelectedDest(e.target.value)}
            placeholder="Dest ID"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Hotel ID</label>
          <input 
            type="number"
            className="w-40 h-9 px-3 text-sm border border-slate-200 rounded-md"
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            placeholder="Hotel ID"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600">Year</label>
          <input 
            type="number"
            className="w-24 h-9 px-3 text-sm border border-slate-200 rounded-md"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          />
        </div>
        <div className="space-y-1 ml-auto">
          <div className="flex bg-slate-200 rounded-md p-0.5">
            <button 
              className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-colors", pricingToggle === 'per_room' ? "bg-white shadow-sm text-slate-900" : "text-slate-600")}
              onClick={() => setPricingToggle('per_room')}
            >
              Per Room
            </button>
            <button 
              className={cn("px-3 py-1.5 text-xs font-medium rounded-sm transition-colors", pricingToggle === 'per_pax' ? "bg-white shadow-sm text-slate-900" : "text-slate-600")}
              onClick={() => setPricingToggle('per_pax')}
            >
              Per Pax
            </button>
          </div>
        </div>
      </div>

      {rates.length > 0 && (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[120px]">Month</th>
                <th className="px-4 py-3 bg-blue-50/50">Double ({pricingToggle === 'per_room' ? 'Room' : 'Pax'})</th>
                <th className="px-4 py-3 bg-orange-50/50">Triple ({pricingToggle === 'per_room' ? 'Room' : 'Pax'})</th>
                <th className="px-4 py-3 bg-orange-50/50">Quad ({pricingToggle === 'per_room' ? 'Room' : 'Pax'})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rates.map((rate, idx) => {
                const isPeak = [4, 5, 11].includes(idx); // Example peak season logic (May, June, Dec)
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                      {rate.month_name}
                      {isPeak && <span className="w-2 h-2 rounded-full bg-orange-500" title="Peak Season" />}
                    </td>
                    
                    <td className="px-4 py-3 bg-blue-50/10">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          className="w-full h-8 pl-6 pr-2 text-sm border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                          value={pricingToggle === 'per_room' ? rate.double_sharing_per_room : rate.double_sharing_per_pax}
                          onChange={(e) => handleRateChange(idx, pricingToggle === 'per_room' ? 'double_sharing_per_room' : 'double_sharing_per_pax', Number(e.target.value))}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3 bg-orange-50/10">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          className="w-full h-8 pl-6 pr-2 text-sm border border-slate-200 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                          value={pricingToggle === 'per_room' ? rate.triple_sharing_per_room : rate.triple_sharing_per_pax}
                          onChange={(e) => handleRateChange(idx, pricingToggle === 'per_room' ? 'triple_sharing_per_room' : 'triple_sharing_per_pax', Number(e.target.value))}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3 bg-orange-50/10">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          className="w-full h-8 pl-6 pr-2 text-sm border border-slate-200 rounded focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                          value={pricingToggle === 'per_room' ? rate.quad_sharing_per_room : rate.quad_sharing_per_pax}
                          onChange={(e) => handleRateChange(idx, pricingToggle === 'per_room' ? 'quad_sharing_per_room' : 'quad_sharing_per_pax', Number(e.target.value))}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

