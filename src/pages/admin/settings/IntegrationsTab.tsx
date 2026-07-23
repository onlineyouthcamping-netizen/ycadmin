import React, { useState, useEffect } from "react";
import { Plug, MessageSquare, Send, Mail, CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IntegrationItem, settingsService } from "@/services/settings.service";
import { toast } from "sonner";

export function IntegrationsTab() {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeModalService, setActiveModalService] = useState<IntegrationItem | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setIsLoading(true);
      const list = await settingsService.getIntegrations();
      setIntegrations(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestIntegration = async (service: string) => {
    try {
      const msg = await settingsService.testIntegration(service);
      toast.success(msg);
      fetchIntegrations();
    } catch (e) {
      toast.error(`Integration test failed for ${service}`);
    }
  };

  const handleOpenConfig = (item: IntegrationItem) => {
    setActiveModalService(item);
    setApiKeyInput("");
    setPhoneInput(item.connectedPhoneNumber || "");
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalService) return;

    try {
      setIsSaving(true);
      await settingsService.connectIntegration(activeModalService.service, {
        provider: activeModalService.provider,
        credentials: {
          apiKey: apiKeyInput,
          phoneNumber: phoneInput
        }
      });
      toast.success(`${activeModalService.service.toUpperCase()} integration connected!`);
      setActiveModalService(null);
      fetchIntegrations();
    } catch (e) {
      toast.error("Failed to save integration settings");
    } finally {
      setIsSaving(false);
    }
  };

  const serviceIcons: Record<string, any> = {
    whatsapp: MessageSquare,
    sms: Send,
    email: Mail,
    payment: CreditCard
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Plug className="w-4 h-4 text-orange-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Third-Party Gateway Integrations</h3>
              <p className="text-[11px] text-slate-500">Connect WhatsApp, SMS, Email, and Razorpay payment services</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {integrations.map((item) => {
            const IconComponent = serviceIcons[item.service] || Plug;
            return (
              <div key={item.service} className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">{item.service} Gateway</h4>
                      <p className="text-[11px] text-slate-500">{item.provider}</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Connected
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono">
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Target Identity</span>
                  <span className="font-semibold text-slate-800">{item.connectedPhoneNumber || "Active Gateway"}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestIntegration(item.service)}
                    className="h-8 text-xs font-semibold border-slate-300"
                  >
                    Test Ping
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenConfig(item)}
                    className="h-8 text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Configure
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integration Modal */}
      {activeModalService && (
        <Dialog open={!!activeModalService} onOpenChange={() => setActiveModalService(null)}>
          <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plug className="w-5 h-5 text-orange-600" />
                Configure {activeModalService.service.toUpperCase()} Integration
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update credentials for {activeModalService.provider}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveIntegration} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">API Key / Auth Secret</Label>
                <Input
                  type="password"
                  placeholder="Paste API Key or Token"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="text-xs border-slate-300 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Connected Identity / Sender Phone</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="text-xs border-slate-300"
                />
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveModalService(null)} className="h-9 text-xs font-semibold">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSaving} className="h-9 text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700">
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
