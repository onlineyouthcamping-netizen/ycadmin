import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 animate-fade-in">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse border-2 border-rose-500/20">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-4 border-background animate-ping" />
      </div>

      <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-2">
        Access Denied
      </h1>
      <p className="text-xs uppercase tracking-widest text-rose-500 font-bold mb-6">
        Error Code: 403 Forbidden
      </p>

      <div className="max-w-md bg-white border-2 border-slate-100 rounded-3xl p-8 shadow-xl mb-8">
        <p className="text-slate-600 font-medium text-sm leading-relaxed">
          You do not have permission to access this area. If you believe this is an error, please contact your administrator to upgrade your role or permissions.
        </p>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="rounded-xl border-2 font-bold uppercase text-[11px] tracking-wider px-6 h-12 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>
        <Button
          onClick={() => navigate("/admin")}
          className="rounded-xl font-bold uppercase text-[11px] tracking-wider px-6 h-12"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
