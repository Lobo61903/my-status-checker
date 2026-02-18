import { useEffect, useState } from "react";
import { FileText, Clock, Loader2, SearchX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface Consulta {
  cpf: string;
  data: string;
}

interface ConsultasTabProps {
  onTabChange: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const ConsultasTab = ({ onTabChange }: ConsultasTabProps) => {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await supabase.functions.invoke("consultas");
        setConsultas(data?.consultas || []);
      } catch {
        setConsultas([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-dark))] to-primary p-5 text-white shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold leading-tight">Minhas Consultas</h1>
                <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
                  CPFs consultados a partir deste dispositivo
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Buscando consultas...</p>
            </div>
          ) : consultas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <SearchX className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Nenhuma consulta encontrada</p>
              <p className="text-[11px] text-muted-foreground/60">
                Realize sua primeira consulta na aba Início
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {consultas.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground tracking-wide">{c.cpf}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(c.data).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <GovFooter activeTab="consultas" onTabChange={onTabChange} />
    </div>
  );
};

export default ConsultasTab;
