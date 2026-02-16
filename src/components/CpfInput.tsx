import { useState } from "react";
import { Search, Shield } from "lucide-react";

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary">
            <Search className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Consulta de Pendências</h1>
          <p className="mt-2 text-muted-foreground">
            Digite seu CPF para verificar sua situação
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <label className="mb-2 block text-sm font-medium text-foreground">
              CPF
            </label>
            <input
              type="text"
              value={cpf}
              onChange={handleChange}
              placeholder="000.000.000-00"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-lg font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              inputMode="numeric"
            />
            <button
              type="submit"
              disabled={!isValid}
              className="mt-4 w-full rounded-xl gradient-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Consultar
            </button>
          </div>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4 text-accent" />
          <span>Seus dados estão protegidos com criptografia</span>
        </div>
      </div>
    </div>
  );
};

export default CpfInput;
