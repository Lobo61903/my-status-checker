import { useState } from "react";
import { FileText, CheckCircle, Download, ArrowLeft, Shield, Calendar, Hash, User, CreditCard, Landmark, Gavel } from "lucide-react";
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

const formatCpf = (cpf: string) => `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
const formatCurrency = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const generateProtocolo = () => `BEN${Math.floor(100000 + Math.random() * 900000)}`;
const getApuracao = () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toLocaleDateString("pt-BR"); };
const getVencimento = () => new Date().toLocaleDateString("pt-BR");
const getAuthCode = () => { const hex = "0123456789abcdef"; return "bf" + Array.from({ length: 8 }, () => hex[Math.floor(Math.random() * hex.length)]).join(""); };

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

      <div className="w-full gradient-primary py-2 sm:py-2.5">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            <span className="text-[11px] sm:text-xs font-bold text-primary-foreground tracking-wide">
              Guia de Liberação — Taxa de Processamento de Benefícios
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] text-primary-foreground/50 font-mono">{protocolo}</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl w-full px-3 sm:px-4 py-5 sm:py-8 animate-fade-in-up flex-1 box-border">
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="gov-header p-3.5 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 sm:h-7 w-0.5 rounded-full bg-accent" />
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Guia de Liberação</h2>
                  <p className="text-[8px] sm:text-[10px] text-white/40">Taxa de Processamento de Benefícios Sociais</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 px-2 sm:px-3 py-1 sm:py-1.5 text-center shrink-0">
                <p className="text-[7px] sm:text-[8px] text-white/40 uppercase tracking-wider">Protocolo</p>
                <p className="text-[10px] sm:text-xs font-bold text-white font-mono">{protocolo}</p>
              </div>
            </div>
            <div className="mt-2.5 sm:mt-3 flex items-center gap-3 text-[8px] sm:text-[9px] text-white/35 flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> Emissão: {new Date().toLocaleDateString("pt-BR")}</span>
              <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Gov.br</span>
              <span className="flex items-center gap-1"><Hash className="h-2.5 w-2.5" /> {authCode}</span>
            </div>
          </div>

          <div className="p-3.5 sm:p-5 space-y-2 sm:space-y-2.5">
            <div className="rounded-lg border border-border p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">Beneficiário</p>
                <p className="font-bold text-foreground text-xs sm:text-sm truncate">{nome}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">CPF</p>
                <p className="font-bold text-foreground font-mono text-[11px] sm:text-xs">{formatCpf(cpf)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <div className="rounded-lg border border-border p-2 sm:p-3">
                <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Referência</p>
                <p className="font-bold text-foreground text-[11px] sm:text-xs">{apuracao}</p>
              </div>
              <div className="rounded-lg border border-border p-2 sm:p-3">
                <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Cód. Benefício</p>
                <p className="font-bold text-foreground text-[11px] sm:text-xs">{firstPendencia?.codigoReceita || "BPC"}</p>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 sm:p-3">
                <p className="text-[7px] sm:text-[9px] text-destructive uppercase tracking-wider mb-0.5 font-medium">Vencimento</p>
                <p className="font-bold text-destructive text-[11px] sm:text-xs">{vencimento}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border p-2 sm:p-3">
              <p className="text-[7px] sm:text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Número de Referência</p>
              <p className="font-bold text-foreground font-mono text-[11px] sm:text-xs">{firstPendencia?.numeroReferencia || protocolo}</p>
            </div>
          </div>

          <div className="mx-3.5 sm:mx-5 border-t border-border" />

          <div className="p-3.5 sm:p-5">
            <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3">
              <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              <h3 className="font-bold text-foreground text-[11px] sm:text-xs uppercase tracking-wider">Discriminação dos Valores</h3>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5">
                  <span className="text-[11px] sm:text-xs text-foreground">Taxa de Processamento</span>
                  <span className="font-bold text-foreground tabular-nums text-[11px] sm:text-sm">{formatCurrency(totalPrincipal)}</span>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5">
                  <span className="text-[11px] sm:text-xs text-foreground">Taxa Administrativa</span>
                  <span className="font-bold text-foreground tabular-nums text-[11px] sm:text-sm">{formatCurrency(totalMulta)}</span>
                </div>
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5">
                  <span className="text-[11px] sm:text-xs text-foreground">Correção Monetária</span>
                  <span className="font-bold text-foreground tabular-nums text-[11px] sm:text-sm">{formatCurrency(totalJuros)}</span>
                </div>
              </div>
              <div className="border-t-2 border-primary/20 bg-primary/5 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
                <span className="font-bold text-primary uppercase tracking-wider text-[11px] sm:text-xs">Valor Total</span>
                <span className="text-base sm:text-xl font-extrabold text-destructive tabular-nums">{formatCurrency(totalGeral)}</span>
              </div>
            </div>
          </div>

          <div className="mx-3.5 sm:mx-5 mb-3.5 sm:mb-5">
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Gavel className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-foreground" />
                <p className="font-bold text-foreground text-[10px] sm:text-[11px] uppercase tracking-wide">Informativo</p>
              </div>
              <ul className="space-y-1 sm:space-y-1.5 text-[9px] sm:text-[10px] text-muted-foreground">
                <li className="flex items-start gap-1.5"><span>•</span><span>O pagamento da taxa é obrigatório para liberação dos benefícios identificados</span></li>
                <li className="flex items-start gap-1.5"><span>•</span><span>Após o pagamento, os valores serão creditados em até 48 horas úteis</span></li>
                <li className="flex items-start gap-1.5"><span>•</span><span>Benefícios não solicitados dentro do prazo serão cancelados automaticamente</span></li>
                <li className="flex items-start gap-1.5"><span>•</span><span>Base legal: Lei nº 8.742/93 (LOAS), Art. 203 da Constituição Federal</span></li>
              </ul>
            </div>
          </div>

          <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5">
            <div className="rounded-lg bg-muted/30 border border-border p-2 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground">
                <Landmark className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent" />
                <span>Ministério do Desenvolvimento Social</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground">
                <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-accent" />
                <span>Autenticação: <strong className="font-mono text-foreground">{authCode}</strong></span>
              </div>
            </div>
          </div>
        </div>

        <button onClick={onGerarDarf} className="mt-3.5 sm:mt-5 w-full rounded-xl gradient-accent py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-md active:scale-[0.98]">
          <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          GERAR GUIA DE PAGAMENTO
        </button>

        <button onClick={onBack} className="mt-2.5 sm:mt-3 w-full flex items-center justify-center gap-2 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Voltar ao resultado
        </button>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default DarfScreen;
