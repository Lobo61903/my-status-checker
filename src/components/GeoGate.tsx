import { useEffect, useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";

interface GeoGateProps {
  children: React.ReactNode;
}

const GeoGate = ({ children }: GeoGateProps) => {
  const { validate } = useTracking();
  const [status, setStatus] = useState<"loading" | "allowed" | "blocked">("loading");
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    validate().then((res) => {
      if (cancelled) return;
      if (res.allowed) {
        setStatus("allowed");
      } else {
        setStatus("blocked");
        setReason(res.reason || "blocked");
      }
    });
    return () => { cancelled = true; };
  }, [validate]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-pulse">
          <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Verificando segurança...</p>
        </div>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {reason === "geo"
              ? "Este serviço está disponível apenas para acessos originados do Brasil e Portugal."
              : reason === "bot"
                ? "Acesso automatizado detectado. Este serviço é exclusivo para pessoas físicas."
                : "Seu acesso foi bloqueado por motivos de segurança."}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 text-accent" />
            <span>Receita Federal do Brasil — Sistema de Segurança</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GeoGate;
