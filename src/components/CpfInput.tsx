import { useState, useRef, useEffect } from "react";
import { Search, Shield, FileText, Lock, Info, Clock, CheckCircle, ChevronRight, AlertTriangle } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

declare global {
  interface Window {
    grecaptcha: {
      render: (container: HTMLElement, params: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; theme?: string; size?: string }) => number;
      reset: (widgetId: number) => void;
      getResponse: (widgetId: number) => string;
    };
  }
}

const RECAPTCHA_SITE_KEY = "6LeSSW0sAAAAAK8yPy-rGD-DGjrUqDi6nt5Z-30k";

interface CpfInputProps {
  onSubmit: (cpf: string, recaptchaToken: string) => void;
  onTabChange: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const CpfInput = ({ onSubmit, onTabChange }: CpfInputProps) => {
  const [cpf, setCpf] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    const renderRecaptcha = () => {
      if (recaptchaRef.current && window.grecaptcha && widgetIdRef.current === null) {
        widgetIdRef.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => setRecaptchaToken(token),
          'expired-callback': () => setRecaptchaToken(null),
          theme: 'light',
        });
      }
    };

    if (window.grecaptcha) {
      renderRecaptcha();
    } else {
      const interval = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(interval);
          renderRecaptcha();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cpf.replace(/\D/g, "");
    if (digits.length === 11 && recaptchaToken) {
      onSubmit(digits, recaptchaToken);
    }
  };

  const isValid = cpf.replace(/\D/g, "").length === 11 && !!recaptchaToken;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

          {/* Welcome card */}
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-dark))] to-primary p-5 text-white shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold leading-tight">
                  Consulta de Pendências
                </h1>
                <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
                  Verifique sua situação cadastral junto à Receita Federal em tempo real
                </p>
              </div>
            </div>
          </div>

          {/* Alert banner */}
          <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-[11px] text-destructive font-medium leading-snug">
              Prazo para regularização: consulte agora e evite multas adicionais
            </p>
          </div>

          {/* Input card */}
          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-lg">
              <label className="mb-1.5 block text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                CPF do Contribuinte
              </label>
              <input
                type="text"
                value={cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className="w-full rounded-xl border-2 border-input bg-background px-4 py-3.5 text-xl font-bold text-foreground tracking-[0.15em] placeholder:text-muted-foreground/30 placeholder:tracking-[0.15em] focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring/10 transition-all text-center"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
              />
              <div className="mt-4 flex justify-center">
                <div ref={recaptchaRef} />
              </div>
              <button
                type="submit"
                disabled={!isValid}
                className="mt-4 w-full rounded-xl gradient-primary px-4 py-4 text-[14px] font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg active:scale-[0.97]"
              >
                <Search className="h-5 w-5" />
                Consultar Situação
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </form>

          {/* Stats cards - horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
            <div className="min-w-[120px] snap-start rounded-2xl border border-border bg-card p-3.5 shadow-sm">
              <p className="text-lg font-extrabold text-primary tabular-nums">2.847</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Consultas hoje</p>
            </div>
            <div className="min-w-[120px] snap-start rounded-2xl border border-border bg-card p-3.5 shadow-sm">
              <p className="text-lg font-extrabold text-accent tabular-nums">1.523</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Regularizados</p>
            </div>
            <div className="min-w-[120px] snap-start rounded-2xl border border-border bg-card p-3.5 shadow-sm">
              <p className="text-lg font-extrabold text-destructive tabular-nums">98,7%</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Com pendências</p>
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/10">
                <Info className="h-4 w-4 text-info" />
              </div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground text-xs mb-1">Sobre a consulta</p>
                <p>
                  Consulta gratuita de pendências fiscais. Dados obtidos em tempo real do sistema SERPRO.
                </p>
              </div>
            </div>
          </div>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-4 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-accent" />
              <span>SSL</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-accent" />
              <span>ICP-Brasil</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-accent" />
              <span>LGPD</span>
            </div>
          </div>
        </div>
      </div>

      <GovFooter activeTab="inicio" onTabChange={onTabChange} />
    </div>
  );
};

export default CpfInput;
