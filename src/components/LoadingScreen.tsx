import { useEffect, useState } from "react";
import { UserCheck, FileSearch, CheckCircle, Shield } from "lucide-react";

interface LoadingScreenProps {
  cpf: string;
  onComplete: (data: { nome: string; nascimento: string; pendencias: Pendencia[] }) => void;
}

export interface Pendencia {
  descricao: string;
  valor: number;
  vencimento: string;
  status: string;
}

const steps = [
  { icon: UserCheck, title: "Verificando Identidade", subtitle: "Validando dados pessoais" },
  { icon: FileSearch, title: "Analisando Situação", subtitle: "Verificando irregularidades" },
  { icon: CheckCircle, title: "Preparando Resultado", subtitle: "Definindo próximas etapas" },
];

const formatCpf = (cpf: string) => {
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
};

const LoadingScreen = ({ cpf, onComplete }: LoadingScreenProps) => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStep(1), 2000);
    const timer2 = setTimeout(() => setActiveStep(2), 4500);

    // Simulate API calls
    const fetchData = async () => {
      // Simulate first API call - personal data
      await new Promise((r) => setTimeout(r, 2500));

      // Simulate second API call - pendencias
      await new Promise((r) => setTimeout(r, 3500));

      // Mock response
      onComplete({
        nome: "USUARIO CONSULTA",
        nascimento: "01/01/1990",
        pendencias: [
          { descricao: "IPTU - Imposto Predial", valor: 1250.00, vencimento: "15/03/2025", status: "Vencido" },
          { descricao: "IPVA - Veículo", valor: 890.50, vencimento: "20/01/2025", status: "Vencido" },
          { descricao: "Multa de Trânsito", valor: 293.47, vencimento: "10/02/2025", status: "Pendente" },
        ],
      });
    };

    fetchData();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [cpf, onComplete]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-2xl animate-fade-in-up">
        {/* Pulsing icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring" />
            <div className="relative h-10 w-10 rounded-full gradient-primary" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Processando Consulta</h1>
          <p className="mt-2 text-muted-foreground">Carregando informações pessoais...</p>
          <p className="mt-1 text-sm text-muted-foreground">Aguarde alguns instantes</p>
        </div>

        {/* Progress bar */}
        <div className="mx-auto mb-8 h-1.5 max-w-sm overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full gradient-loading animate-progress-bar" />
        </div>

        {/* Steps */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i <= activeStep;
            return (
              <div
                key={i}
                className={`rounded-xl border p-6 text-center transition-all duration-500 ${
                  isActive
                    ? "border-primary/30 bg-card shadow-md"
                    : "border-border bg-card/50"
                }`}
              >
                <div className="mb-3 flex justify-center">
                  <Icon
                    className={`h-8 w-8 transition-colors duration-500 ${
                      isActive ? "text-primary" : "text-muted-foreground/40"
                    }`}
                  />
                </div>
                <h3 className={`font-semibold transition-colors duration-500 ${
                  isActive ? "text-foreground" : "text-muted-foreground/60"
                }`}>
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Security notice */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-accent shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground">Conexão Segura</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Seus dados estão sendo processados com segurança através de conexão criptografada.
                CPF consultado: {formatCpf(cpf)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
