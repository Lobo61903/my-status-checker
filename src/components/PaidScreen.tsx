import { CheckCircle, Shield, Download, ArrowLeft, Landmark } from "lucide-react";
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
          <div className="text-center mb-5 sm:mb-8">
            <div className="mx-auto mb-3 sm:mb-4 flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-accent/10 border-4 border-accent/20">
              <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-accent" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">Pagamento Confirmado!</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              Sua pendência foi regularizada com sucesso
            </p>
          </div>

          {/* Receipt card */}
          <div className="rounded-xl sm:rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
            <div className="bg-accent/10 p-4 sm:p-6 text-center border-b border-border">
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Valor Pago</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-accent tabular-nums">{formatCurrency(valor)}</p>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Contribuinte</span>
                <span className="font-semibold text-foreground">{nome}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">CPF</span>
                <span className="font-semibold text-foreground">{formatCpf(cpf)}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Transação</span>
                <span className="font-mono text-[10px] sm:text-xs text-foreground">{transactionId}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] sm:text-xs font-bold">
                  <CheckCircle className="h-3 w-3" />
                  PAGO
                </span>
              </div>
            </div>

            {/* Security footer */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-5">
              <div className="rounded-lg sm:rounded-xl bg-muted/30 border border-border p-2.5 sm:p-3 flex items-center justify-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Landmark className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
                  <span>Receita Federal</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Shield className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
                  <span>Comprovante válido</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="mt-4 sm:mt-5 w-full rounded-xl sm:rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base font-bold gradient-primary text-primary-foreground hover:opacity-90 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Nova Consulta
          </button>
        </div>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default PaidScreen;
