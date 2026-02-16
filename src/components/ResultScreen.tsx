import { AlertTriangle, User, Calendar, FileText, ArrowLeft } from "lucide-react";
import type { Pendencia } from "./LoadingScreen";

interface ResultScreenProps {
  nome: string;
  nascimento: string;
  cpf: string;
  pendencias: Pendencia[];
  onBack: () => void;
}

const formatCpf = (cpf: string) => {
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
};

const formatCurrency = (value: number) => {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const ResultScreen = ({ nome, nascimento, cpf, pendencias, onBack }: ResultScreenProps) => {
  const total = pendencias.reduce((sum, p) => sum + p.valor, 0);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl animate-fade-in-up">
        {/* Header */}
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Nova consulta
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-6">Resultado da Consulta</h1>

        {/* Person info */}
        <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">{nome}</p>
                <p className="text-sm text-muted-foreground">CPF: {formatCpf(cpf)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Nascimento: {nascimento}</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 rounded-xl gradient-primary p-5 text-primary-foreground shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Total de pendências</p>
              <p className="text-3xl font-bold">{formatCurrency(total)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-2 text-sm opacity-80">
            {pendencias.length} {pendencias.length === 1 ? "pendência encontrada" : "pendências encontradas"}
          </p>
        </div>

        {/* Pendencias list */}
        <div className="space-y-3">
          {pendencias.map((p, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                    <FileText className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{p.descricao}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Vencimento: {p.vencimento}
                    </p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.status === "Vencido"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(p.valor)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultScreen;
