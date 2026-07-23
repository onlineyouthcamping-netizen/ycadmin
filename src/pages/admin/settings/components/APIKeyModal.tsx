import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Download, Key, Check } from "lucide-react";
import { toast } from "sonner";

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (name: string, permissions: string[]) => Promise<{ keySecret: string } | null>;
}

export function APIKeyModal({ isOpen, onClose, onGenerate }: APIKeyModalProps) {
  const [name, setName] = useState("");
  const [readPerm, setReadPerm] = useState(true);
  const [writePerm, setWritePerm] = useState(false);
  const [adminPerm, setAdminPerm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    const perms: string[] = [];
    if (readPerm) perms.push("read");
    if (writePerm) perms.push("write");
    if (adminPerm) perms.push("admin");

    if (perms.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    try {
      setIsGenerating(true);
      const res = await onGenerate(name.trim(), perms);
      if (res?.keySecret) {
        setGeneratedSecret(res.keySecret);
        toast.success("API key generated successfully!");
      }
    } catch (err: any) {
      toast.error("Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSecret) return;
    navigator.clipboard.writeText(generatedSecret);
    setIsCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedSecret) return;
    const element = document.createElement("a");
    const file = new Blob([`Key Name: ${name}\nAPI Secret: ${generatedSecret}\nCreated: ${new Date().toISOString()}`], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `api_key_${name.replace(/\s+/g, "_").toLowerCase()}.txt`;
    document.body.appendChild(element);
    element.click();
    element.remove();
  };

  const handleClose = () => {
    setName("");
    setReadPerm(true);
    setWritePerm(false);
    setAdminPerm(false);
    setGeneratedSecret(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-white p-6 rounded-xl border border-slate-200">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-orange-600" />
            {generatedSecret ? "API Key Generated" : "Generate New API Key"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {generatedSecret
              ? "Copy or download your API secret key now. It will never be shown again."
              : "API keys allow programmatic access to YouthCamping OS APIs."}
          </DialogDescription>
        </DialogHeader>

        {generatedSecret ? (
          <div className="space-y-4 py-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs">
              🔒 <strong>Save this key now!</strong> For security reasons, this secret will not be displayed again.
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">API Secret Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generatedSecret}
                  readOnly
                  className="font-mono text-xs font-semibold bg-slate-50 border-slate-300 text-slate-900 select-all"
                />
                <Button size="sm" onClick={handleCopy} className="h-9 bg-orange-600 hover:bg-orange-700 text-white shrink-0">
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="w-full h-9 text-xs font-semibold text-slate-700 border-slate-300">
                <Download className="w-4 h-4 mr-1.5 text-slate-500" />
                Download .txt File
              </Button>
              <Button size="sm" onClick={handleClose} className="w-full h-9 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerate} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Key Name</Label>
              <Input
                placeholder="e.g., Mobile App Integration, Production Webhook"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Permissions</Label>
              <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-read" checked={readPerm} onCheckedChange={(c) => setReadPerm(!!c)} />
                  <label htmlFor="perm-read" className="text-xs text-slate-700 cursor-pointer font-medium">
                    Read (View bookings, trips, and reports)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-write" checked={writePerm} onCheckedChange={(c) => setWritePerm(!!c)} />
                  <label htmlFor="perm-write" className="text-xs text-slate-700 cursor-pointer font-medium">
                    Write (Create and update bookings)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="perm-admin" checked={adminPerm} onCheckedChange={(c) => setAdminPerm(!!c)} />
                  <label htmlFor="perm-admin" className="text-xs text-slate-700 cursor-pointer font-medium">
                    Admin (Full management privileges)
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} className="h-9 text-xs font-semibold">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isGenerating} className="h-9 text-xs font-semibold bg-orange-600 text-white hover:bg-orange-700">
                {isGenerating ? "Generating..." : "Generate API Key"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
