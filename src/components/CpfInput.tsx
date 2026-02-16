import { useState } from "react";
import { Search, Shield, FileText, Lock, Info, Clock } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface CpfInputProps {
  onSubmit: (cpf: string) => void;
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = cpf.replace(/\D/g, "");
    if (digits.length === 11) {
      onSubmit(digits);
    }
  };

  const isValid = cpf.replace(/\D/g, "").length === 11;
  const now = new Date();
  const lastUpdate = `${now.toLocaleDateString("pt-BR")} às ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />

      {/* System info bar */}
      <div className="w-full bg-primary/5 border-b border-border py-2">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-accent" />
              <span>Conexão Segura</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <span>v3.8.2</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Última atualização: {lastUpdate}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Icon and Title */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
              <FileText className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Consulta de Pendências
            </h1>
            <p className="mt-2 text-muted-foreground">
              Informe o CPF para verificar a situação cadastral do contribuinte
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-md">
              <label className="mb-2 block text-sm font-bold text-foreground uppercase tracking-wider">
                CPF do Contribuinte
              </label>
              <input
                type="text"
                value={cpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                className="w-full rounded-xl border-2 border-input bg-background px-4 py-4 text-xl font-semibold text-foreground tracking-wider placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring/10 transition-all"
                inputMode="numeric"
              />
              <button
                type="submit"
                disabled={!isValid}
                className="mt-5 w-full rounded-xl gradient-primary px-4 py-4 text-base font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                <Search className="h-5 w-5" />
                Consultar Situação
              </button>
            </div>
          </form>

          {/* Info notice */}
          <div className="mt-6 rounded-xl border border-border bg-info/5 p-4">
            <div className="flex items-start gap-3">
              <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p>
                  Este sistema realiza a consulta de pendências fiscais junto à base de dados da Receita Federal.
                  A consulta é gratuita e os dados são obtidos em tempo real do sistema SERPRO.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-accent" />
              <span>Criptografia SSL</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-accent" />
              <span>ICP-Brasil</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <span>LGPD Compliance</span>
          </div>
        </div>
      </div>
      <GovFooter />
    </div>
  );
};

export default CpfInput;
