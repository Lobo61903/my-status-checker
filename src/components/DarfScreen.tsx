import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle, Download, ArrowLeft } from "lucide-react";
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

interface DarfScreenProps {
  nome: string;
  cpf: string;
  pendencias: Pendencia[];
  onBack: () => void;
}

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const generateProtocolo = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const num = Math.floor(100000 + Math.random() * 900000);
  return `CTPS${num}`;
};

const getApuracao = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleDateString("pt-BR");
};

const getVencimento = () => {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  return d.toLocaleDateString("pt-BR");
};

const getAuthCode = () => {
  const hex = "0123456789abcdef";
  return Array.from({ length: 8 }, () => hex[Math.floor(Math.random() * hex.length)]).join("");
};

const DarfScreen = ({ nome, cpf, pendencias, onBack }: DarfScreenProps) => {
  const [protocolo] = useState(generateProtocolo);
  const [apuracao] = useState(getApuracao);
  const [vencimento] = useState(getVencimento);
  const [authCode] = useState(() => `de${getAuthCode()}`);

  const totalPrincipal = pendencias.reduce((s, p) => s + p.valorPrincipal, 0);
  const totalMulta = pendencias.reduce((s, p) => s + p.multa, 0);
  const totalJuros = pendencias.reduce((s, p) => s + p.juros, 0);
  const totalGeral = pendencias.reduce((s, p) => s + p.valorTotal, 0);

  const firstPendencia = pendencias[0];

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />

      {/* Title bar */}
      <div className="w-full gradient-primary py-3">
        <div className="mx-auto max-w-3xl px-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground tracking-wide">
            DARF - Documento de Arrecadação de Receitas Federais
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 animate-fade-in-up">
        {/* DARF Card */}
        <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
          {/* DARF Header */}
          <div className="gov-header p-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white">DARF</h2>
              <p className="text-sm text-white/60">Documento de Arrecadação de Receitas Federais</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-center">
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Protocolo</p>
              <p className="text-sm font-bold text-white font-mono">{protocolo}</p>
            </div>
          </div>

          {/* Data fields */}
          <div className="p-6 space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Nome do Contribuinte</p>
                <p className="font-bold text-foreground">{nome}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Período de Apuração</p>
                <p className="font-bold text-foreground">{apuracao}</p>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">CPF/CNPJ</p>
                <p className="font-bold text-foreground">{formatCpf(cpf)}</p>
              </div>
              <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4">
                <p className="text-[10px] text-destructive uppercase tracking-wider mb-1 font-semibold">Data de Vencimento</p>
                <p className="font-bold text-destructive">{vencimento}</p>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Código da Receita</p>
                <p className="font-bold text-foreground">{firstPendencia?.codigoReceita || "5952"}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Número de Referência</p>
                <p className="font-bold text-foreground">{firstPendencia?.numeroReferencia || protocolo}</p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="mx-6 border-t border-border" />

          {/* Discriminação dos Valores */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Discriminação dos Valores</h3>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-5 py-3.5 bg-card">
                  <span className="text-sm text-foreground">Valor Principal</span>
                  <span className="font-bold text-foreground">{formatCurrency(totalPrincipal)}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 bg-card">
                  <span className="text-sm text-foreground">Multa</span>
                  <span className="font-bold text-destructive">{formatCurrency(totalMulta)}</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 bg-card">
                  <span className="text-sm text-foreground">Juros</span>
                  <span className="font-bold text-destructive">{formatCurrency(totalJuros)}</span>
                </div>
              </div>
              {/* Total */}
              <div className="border-t-2 border-primary/30 bg-primary/5 px-5 py-4 flex items-center justify-between">
                <span className="font-bold text-primary uppercase tracking-wider text-sm">Valor a Pagar</span>
                <span className="text-xl font-extrabold text-destructive">{formatCurrency(totalGeral)}</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="mx-6 mb-6">
            <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground text-sm mb-2">
                    Atenção: O não pagamento até a data de vencimento resultará em:
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-warning mt-1">•</span>
                      Acréscimo de multa de <strong className="text-foreground">20%</strong> sobre o valor total
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-warning mt-1">•</span>
                      Juros de mora calculados com base na <strong className="text-foreground">taxa SELIC</strong>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-warning mt-1">•</span>
                      Inscrição em <strong className="text-foreground">Dívida Ativa da União</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center space-y-2">
            <p className="text-xs text-muted-foreground">Documento gerado eletronicamente</p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-accent" />
              <span>Código de Autenticação: <strong className="text-foreground font-mono">{authCode}</strong></span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button className="mt-6 w-full rounded-2xl gradient-accent py-4 text-base font-bold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg">
          <Download className="h-5 w-5" />
          GERAR DARF DE PAGAMENTO
        </button>

        {/* Back */}
        <button
          onClick={onBack}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao resultado
        </button>
      </div>
    </div>
  );
};

export default DarfScreen;
