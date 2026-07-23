import React from "react";
import { CreditCard, CheckCircle2, ShieldCheck, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function BillingTab() {
  const invoices = [
    { id: "INV-2026-007", date: "July 01, 2026", amount: "₹9,999", status: "Paid", pdf: "invoice_jul_2026.pdf" },
    { id: "INV-2026-006", date: "June 01, 2026", amount: "₹9,999", status: "Paid", pdf: "invoice_jun_2026.pdf" },
    { id: "INV-2026-005", date: "May 01, 2026", amount: "₹9,999", status: "Paid", pdf: "invoice_may_2026.pdf" }
  ];

  const handleDownloadInvoice = (invoiceId: string) => {
    toast.success(`Downloading invoice ${invoiceId}...`);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Current Plan Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 rounded-xl border border-slate-800 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">YouthCamping Enterprise Plan</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Unlimited departures, full API access, and dedicated support</p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => toast.info("Your Enterprise plan is currently fully active.")}
            className="h-9 px-4 text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white"
          >
            Upgrade Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Cycle</span>
            <span className="font-semibold text-slate-200">Annual (Auto-Renewal)</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Next Renewal</span>
            <span className="font-semibold text-slate-200">January 15, 2027</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
            <span className="font-semibold text-slate-200">Visa ending in 8892</span>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <CreditCard className="w-4 h-4 text-orange-600" />
          <h3 className="text-sm font-bold text-slate-900">Invoice & Receipt History</h3>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Amount</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {inv.id}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {inv.date}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {inv.amount}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" /> {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadInvoice(inv.id)}
                      className="h-7 text-xs text-orange-600 hover:bg-orange-50 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 mr-1" /> PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
