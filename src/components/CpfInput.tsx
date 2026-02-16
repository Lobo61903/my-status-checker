import { useState, useRef, useEffect } from "react";
import { Search, Shield, FileText, Lock, Info, Clock, CheckCircle } from "lucide-react";
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
}

const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const CpfInput = ({ onSubmit }: CpfInputProps) => {
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
  const now = new Date();
  const lastUpdate = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />

      {/* System info bar */}
      <div className="w-full bg-primary/5 border-b border-border py-1.5 sm:py-2">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1">
              <Lock className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
              <span>Conexão Segura</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <span>v3.8.2</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
            <span className="hidden sm:inline">Última atualização: {lastUpdate}</span>
            <span className="sm:hidden">{now.toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Icon and Title */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Consulta de Pendências
            </h1>
            <p className="mt-1.5 sm:mt-2 text-sm text-muted-foreground px-2">
              Informe o CPF para verificar a situação cadastral do contribuinte
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-8 shadow-md">
              <label className="mb-2 block text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
                CPF do Contribuinte
              </label>
              <input
                type="text"
                value={cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className="w-full rounded-xl border-2 border-input bg-background px-4 py-3.5 sm:py-4 text-lg sm:text-xl font-semibold text-foreground tracking-wider placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring/10 transition-all"
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
                className="mt-4 sm:mt-5 w-full rounded-xl gradient-primary px-4 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                Consultar Situação
              </button>
            </div>
          </form>

          {/* Stats bar */}
          <div className="mt-4 sm:mt-6 rounded-xl border border-border bg-card p-3 sm:p-4 shadow-sm">
            <div className="grid grid-cols-3 divide-x divide-border text-center">
              <div>
                <p className="text-base sm:text-lg font-extrabold text-primary tabular-nums">2.847</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Consultas hoje</p>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-accent tabular-nums">1.523</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Regularizados</p>
              </div>
              <div>
                <p className="text-base sm:text-lg font-extrabold text-destructive tabular-nums">98,7%</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Com pendências</p>
              </div>
            </div>
          </div>

          {/* Info notice */}
          <div className="mt-3 sm:mt-4 rounded-xl border border-border bg-info/5 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <Info className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-info shrink-0 mt-0.5" />
              <div className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                <p>
                  Este sistema realiza a consulta de pendências fiscais junto à base de dados da Receita Federal.
                  A consulta é gratuita e os dados são obtidos em tempo real do sistema SERPRO.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 sm:mt-4 flex items-center justify-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <Shield className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
              <span>Criptografia SSL</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Lock className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
              <span>ICP-Brasil</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <CheckCircle className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
              <span>LGPD</span>
            </div>
          </div>
        </div>
      </div>
      <GovFooter />
    </div>
  );
};

export default CpfInput;
