import React, { useState, useEffect } from "react";
import { Key, Plus, Trash2, Copy, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APIKeyModal } from "./components/APIKeyModal";
import { APIKeyItem, settingsService } from "@/services/settings.service";
import { toast } from "sonner";

export function APIKeysTab() {
  const [keys, setKeys] = useState<APIKeyItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const list = await settingsService.getAPIKeys();
      setKeys(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKey = async (name: string, permissions: string[]) => {
    const res = await settingsService.generateAPIKey({ name, permissions });
    fetchKeys();
    return res;
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action is permanent.")) return;
    try {
      await settingsService.deleteAPIKey(keyId);
      toast.success("API key revoked");
      fetchKeys();
    } catch (e) {
      toast.error("Failed to revoke API key");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-orange-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">API Keys & Webhook Credentials</h3>
              <p className="text-[11px] text-slate-500">Manage secret keys for external integrations and custom scripts</p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="h-8 text-xs font-bold uppercase tracking-wider bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Generate New Key
          </Button>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-4">Key Name</th>
                <th className="py-2.5 px-4">Key Preview</th>
                <th className="py-2.5 px-4">Permissions</th>
                <th className="py-2.5 px-4">Created Date</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {k.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                    {k.keyPreview}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      {k.permissions.map((p, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(k.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKey(k.id)}
                      className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Revoke
                    </Button>
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No active API keys found. Click "Generate New Key" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <APIKeyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerate={handleGenerateKey}
      />
    </div>
  );
}
