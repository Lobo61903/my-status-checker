import { useEffect, useState, useRef } from "react";
import { UserCheck, FileSearch, CheckCircle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import GovHeader from "./GovHeader";

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
  { icon: UserCheck, title: "Verificando Identidade", subtitle: "Validando dados do contribuinte" },
  { icon: FileSearch, title: "Analisando Situação", subtitle: "Verificando irregularidades fiscais" },
  { icon: CheckCircle, title: "Preparando Resultado", subtitle: "Gerando relatório de pendências" },
];

const formatCpf = (cpf: string) => {
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
};

const LoadingScreen = ({ cpf, onComplete }: LoadingScreenProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const timer1 = setTimeout(() => setActiveStep(1), 2000);
    const timer2 = setTimeout(() => setActiveStep(2), 4500);

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
        if (elapsed < 6000) await new Promise((r) => setTimeout(r, 6000 - elapsed));

        onComplete({
          nome: consultaData?.success ? consultaData.nome : "ERRO NA CONSULTA",
          nascimento: consultaData?.success ? consultaData.dataNascimento : "--/--/----",
          sexo: consultaData?.success ? consultaData.sexo : "N/A",
          pendencias: pendenciasData?.success ? pendenciasData.pendencias : [],
        });
      } catch (error) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 6000) await new Promise((r) => setTimeout(r, 6000 - elapsed));
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
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [cpf, onComplete]);

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl animate-fade-in-up">
          {/* Pulsing indicator */}
          <div className="mb-8 flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/15 animate-pulse-ring" />
              <div className="relative h-12 w-12 rounded-full gradient-primary shadow-lg" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Processando Consulta</h1>
            <p className="mt-2 text-muted-foreground">Verificando informações do contribuinte...</p>
          </div>

          {/* Progress bar */}
          <div className="mx-auto mb-10 h-2 max-w-md overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full gradient-loading animate-progress-bar" />
          </div>

          {/* Steps */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= activeStep;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border-2 p-6 text-center transition-all duration-500 ${
                    isActive
                      ? "border-primary/30 bg-card shadow-md"
                      : "border-transparent bg-card/40"
                  }`}
                >
                  <div className="mb-3 flex justify-center">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-500 ${
                      isActive ? "gradient-primary shadow-sm" : "bg-muted"
                    }`}>
                      <Icon className={`h-6 w-6 transition-colors duration-500 ${isActive ? "text-primary-foreground" : "text-muted-foreground/40"}`} />
                    </div>
                  </div>
                  <h3 className={`font-bold transition-colors duration-500 ${isActive ? "text-foreground" : "text-muted-foreground/50"}`}>
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{step.subtitle}</p>
                </div>
              );
            })}
          </div>

          {/* Security notice */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                <Shield className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Conexão Segura</h4>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Seus dados estão sendo processados em ambiente seguro com criptografia de ponta a ponta.
                  CPF consultado: <span className="font-semibold text-foreground">{formatCpf(cpf)}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
