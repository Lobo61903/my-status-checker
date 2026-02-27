import { AlertCircle, Shield, ArrowRight, Landmark, Gavel } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface PendenciaErrorScreenProps {
  nome: string;
  cpf: string;
  valorNovaPendencia: number;
  onRegularizar: () => void;
  onTabChange?: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const PendenciaErrorScreen = ({ nome, cpf, valorNovaPendencia, onRegularizar, onTabChange }: PendenciaErrorScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader nome={nome} cpf={cpf} />

      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Status icon */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="mx-auto mb-2.5 sm:mb-3 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-destructive/10 border-2 border-destructive/20">
              <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
            </div>
            <h1 className="text-base sm:text-xl font-bold text-foreground">Nova Pendência Identificada</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              O sistema identificou uma irregularidade adicional vinculada ao CPF
            </p>
          </div>

          {/* Detail card */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="bg-destructive/5 p-3.5 sm:p-5 text-center border-b border-border">
              <div className="flex items-center justify-center gap-1.5 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                <p className="text-[9px] sm:text-[10px] text-destructive font-bold uppercase tracking-wider">Situação Irregular</p>
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Valor da Pendência</p>
              <p className="text-xl sm:text-2xl font-extrabold text-destructive tabular-nums">{formatCurrency(valorNovaPendencia)}</p>
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
                <span className="text-muted-foreground">Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[9px] sm:text-[10px] font-bold">
                  <AlertCircle className="h-2.5 w-2.5" />
                  IRREGULAR
                </span>
              </div>

              <div className="mt-2.5 rounded-lg bg-muted/30 border border-border p-2.5 sm:p-3">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">
                  Após a verificação do pagamento anterior, o sistema da Receita Federal identificou uma pendência adicional vinculada ao seu CPF que necessita de regularização para evitar restrições cadastrais.
                </p>
              </div>
            </div>

            {/* Informativo */}
            <div className="mx-3.5 sm:mx-5 mb-3 sm:mb-4">
              <div className="rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Gavel className="h-3 w-3 text-foreground" />
                  <p className="font-bold text-foreground text-[9px] sm:text-[10px] uppercase tracking-wide">Informativo</p>
                </div>
                <p className="text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed">
                  O não pagamento acarretará aplicação de multa, juros SELIC e possível inscrição em Dívida Ativa da União, conforme Art. 44 da Lei 9.430/96 e Lei 6.830/80.
                </p>
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
                  <span>Consulta oficial</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onRegularizar}
            className="mt-3.5 sm:mt-4 w-full rounded-xl py-3 sm:py-3.5 text-xs sm:text-sm font-bold gradient-accent text-accent-foreground hover:opacity-90 transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Regularizar Pendência
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default PendenciaErrorScreen;
