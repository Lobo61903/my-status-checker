import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle, Download, ArrowLeft, Shield, Calendar, Hash, User, CreditCard, Lock, Landmark } from "lucide-react";
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

interface DarfScreenProps {
  nome: string;
  cpf: string;
  pendencias: Pendencia[];
  onBack: () => void;
  onGerarDarf: () => void;
  onTabChange?: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const generateProtocolo = () => `CTPS${Math.floor(100000 + Math.random() * 900000)}`;

const getApuracao = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString("pt-BR");
};

const getVencimento = () => new Date().toLocaleDateString("pt-BR");

const getAuthCode = () => {
  const hex = "0123456789abcdef";
  return "de" + Array.from({ length: 8 }, () => hex[Math.floor(Math.random() * hex.length)]).join("");
};

const DarfScreen = ({ nome, cpf, pendencias, onBack, onGerarDarf, onTabChange }: DarfScreenProps) => {
  const [protocolo] = useState(generateProtocolo);
  const [apuracao] = useState(getApuracao);
  const [vencimento] = useState(getVencimento);
  const [authCode] = useState(getAuthCode);

  const totalPrincipal = pendencias.reduce((s, p) => s + p.valorPrincipal, 0);
  const totalMulta = pendencias.reduce((s, p) => s + p.multa, 0);
  const totalJuros = pendencias.reduce((s, p) => s + p.juros, 0);
  const totalGeral = pendencias.reduce((s, p) => s + p.valorTotal, 0);
  const firstPendencia = pendencias[0];

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <GovHeader nome={nome} cpf={cpf} />

      {/* Title bar */}
      <div className="w-full gradient-primary py-2 sm:py-3">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            <span className="text-xs sm:text-sm font-bold text-primary-foreground tracking-wide">
              DARF - Documento de Arrecadação
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-primary-foreground/60 font-mono">
            SRF-{protocolo}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl w-full px-3 sm:px-4 py-5 sm:py-8 animate-fade-in-up flex-1 box-border">
        {/* DARF Card */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          {/* DARF Header */}
          <div className="gov-header p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 sm:h-8 w-1 rounded-full bg-accent" />
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">DARF</h2>
                  <p className="text-[9px] sm:text-[11px] text-white/50">Documento de Arrecadação de Receitas Federais</p>
                </div>
              </div>
              <div className="rounded-lg sm:rounded-xl border border-white/15 bg-white/8 px-2 sm:px-4 py-1.5 sm:py-2 text-center shrink-0">
                <p className="text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider">Protocolo</p>
                <p className="text-xs sm:text-sm font-bold text-white font-mono">{protocolo}</p>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] text-white/40 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> Emissão: {new Date().toLocaleDateString("pt-BR")}</span>
              <span className="flex items-center gap-1"><Shield className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> ICP-Brasil</span>
              <span className="flex items-center gap-1"><Hash className="h-2.5 sm:h-3 w-2.5 sm:w-3" /> {authCode}</span>
            </div>
          </div>

          {/* Data fields */}
          <div className="p-4 sm:p-6 space-y-2.5 sm:space-y-3">
            {/* Contribuinte */}
            <div className="rounded-lg sm:rounded-xl border border-border p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Contribuinte</p>
                <p className="font-bold text-foreground text-sm truncate">{nome}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">CPF</p>
                <p className="font-bold text-foreground font-mono text-xs sm:text-sm">{formatCpf(cpf)}</p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
              <div className="rounded-lg sm:rounded-xl border border-border p-2.5 sm:p-4">
                <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">Apuração</p>
                <p className="font-bold text-foreground text-xs sm:text-sm">{apuracao}</p>
              </div>
              <div className="rounded-lg sm:rounded-xl border border-border p-2.5 sm:p-4">
                <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">Cód. Receita</p>
                <p className="font-bold text-foreground text-xs sm:text-sm">{firstPendencia?.codigoReceita || "5952"}</p>
              </div>
              <div className="rounded-lg sm:rounded-xl border-2 border-destructive/30 bg-destructive/5 p-2.5 sm:p-4">
                <p className="text-[8px] sm:text-[10px] text-destructive uppercase tracking-wider mb-0.5 sm:mb-1 font-semibold">Vencimento</p>
                <p className="font-bold text-destructive text-xs sm:text-sm">{vencimento}</p>
              </div>
            </div>

            {/* Referência */}
            <div className="rounded-lg sm:rounded-xl border border-border p-2.5 sm:p-4">
              <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">Número de Referência</p>
              <p className="font-bold text-foreground font-mono text-xs sm:text-sm">{firstPendencia?.numeroReferencia || protocolo}</p>
            </div>
          </div>

          <div className="mx-4 sm:mx-6 border-t border-border" />

          {/* Valores */}
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              <h3 className="font-bold text-foreground text-xs sm:text-sm uppercase tracking-wider">Discriminação dos Valores</h3>
            </div>

            <div className="rounded-lg sm:rounded-xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5">
                  <span className="text-xs sm:text-sm text-foreground">Valor Principal</span>
                  <span className="font-bold text-foreground tabular-nums text-xs sm:text-base">{formatCurrency(totalPrincipal)}</span>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5">
                  <span className="text-xs sm:text-sm text-foreground">Multa</span>
                  <span className="font-bold text-destructive tabular-nums text-xs sm:text-base">{formatCurrency(totalMulta)}</span>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5">
                  <span className="text-xs sm:text-sm text-foreground">Juros de Mora (SELIC)</span>
                  <span className="font-bold text-destructive tabular-nums text-xs sm:text-base">{formatCurrency(totalJuros)}</span>
                </div>
              </div>
              <div className="border-t-2 border-primary/30 bg-primary/5 px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
                <span className="font-bold text-primary uppercase tracking-wider text-xs sm:text-sm">Valor Total</span>
                <span className="text-lg sm:text-2xl font-extrabold text-destructive tabular-nums">{formatCurrency(totalGeral)}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mx-4 sm:mx-6 mb-4 sm:mb-6">
            <div className="rounded-lg sm:rounded-xl border-2 border-destructive/40 bg-destructive/5 p-3 sm:p-5">
              <div className="flex items-start gap-2 sm:gap-3 mb-2">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0 mt-0.5 animate-pulse" />
                <p className="font-bold text-destructive text-xs sm:text-sm">
                  ATENÇÃO: Consequências do não pagamento
                </p>
              </div>
              <ul className="space-y-1 sm:space-y-1.5 ml-6 sm:ml-8 text-[10px] sm:text-xs text-muted-foreground">
                <li className="flex items-start gap-1.5">
                  <span className="text-destructive font-bold">•</span>
                  <span>Multa de <strong className="text-foreground">20%</strong> + juros SELIC acumulados</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-destructive font-bold">•</span>
                  <span>Inscrição em <strong className="text-foreground">Dívida Ativa da União</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-destructive font-bold">•</span>
                  <span><strong className="text-foreground">Bloqueio do CPF</strong> junto à Receita Federal</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-destructive font-bold">•</span>
                  <span>Possibilidade de <strong className="text-foreground">penhora de bens</strong> e execução fiscal</span>
                </li>
              </ul>
              <p className="mt-2 sm:mt-3 ml-6 sm:ml-8 text-[10px] sm:text-xs text-destructive font-semibold italic">
                Regularize agora e evite complicações futuras.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="rounded-lg sm:rounded-xl bg-muted/30 border border-border p-2.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                <Landmark className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span>Receita Federal do Brasil</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                <span>Autenticação: <strong className="font-mono text-foreground">{authCode}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onGerarDarf}
          className="mt-4 sm:mt-6 w-full rounded-xl sm:rounded-2xl gradient-accent py-3.5 sm:py-4 text-sm sm:text-base font-bold text-accent-foreground transition-all hover:opacity-90 hover:shadow-xl flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
        >
          <Download className="h-4 w-4 sm:h-5 sm:w-5" />
          GERAR DARF DE PAGAMENTO
        </button>

        <button
          onClick={onBack}
          className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Voltar ao resultado
        </button>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default DarfScreen;
