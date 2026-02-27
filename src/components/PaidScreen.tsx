import { CheckCircle, Shield, ArrowLeft, Landmark } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface PaidScreenProps {
  nome: string;
  cpf: string;
  valor: number;
  transactionId: string;
  onBack: () => void;
  onTabChange?: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const PaidScreen = ({ nome, cpf, valor, transactionId, onBack, onTabChange }: PaidScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader nome={nome} cpf={cpf} />

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Success icon */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="mx-auto mb-2.5 sm:mb-3 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-accent/10 border-2 border-accent/20">
              <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
            </div>
            <h1 className="text-base sm:text-xl font-bold text-foreground">Pagamento Confirmado</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              A pendência foi regularizada junto à Receita Federal
            </p>
          </div>

          {/* Receipt card */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="bg-accent/10 p-3.5 sm:p-5 text-center border-b border-border">
              <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Valor Pago</p>
              <p className="text-xl sm:text-2xl font-extrabold text-accent tabular-nums">{formatCurrency(valor)}</p>
            </div>

            <div className="p-3.5 sm:p-5 space-y-2.5 sm:space-y-3">
              <div className="flex justify-between items-center text-[11px] sm:text-xs">
                <span className="text-muted-foreground">Contribuinte</span>
                <span className="font-semibold text-foreground">{nome}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] sm:text-xs">
                <span className="text-muted-foreground">CPF</span>
                <span className="font-semibold text-foreground">{formatCpf(cpf)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] sm:text-xs">
                <span className="text-muted-foreground">Transação</span>
                <span className="font-mono text-[9px] sm:text-[10px] text-foreground">{transactionId}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] sm:text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] sm:text-[10px] font-bold">
                  <CheckCircle className="h-2.5 w-2.5" />
                  PAGO
                </span>
              </div>
            </div>

            {/* Security footer */}
            <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-4">
              <div className="rounded-lg bg-muted/30 border border-border p-2 sm:p-2.5 flex items-center justify-center gap-3 sm:gap-4 text-[8px] sm:text-[9px] text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Landmark className="h-2.5 w-2.5 text-accent" />
                  <span>Receita Federal do Brasil</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Shield className="h-2.5 w-2.5 text-accent" />
                  <span>Comprovante válido</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="mt-3.5 sm:mt-4 w-full rounded-xl py-3 sm:py-3.5 text-xs sm:text-sm font-bold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Nova Consulta
          </button>
        </div>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default PaidScreen;
