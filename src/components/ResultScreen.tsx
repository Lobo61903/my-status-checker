import { useState, useEffect } from "react";
import {
  AlertTriangle, Calendar, User, Shield, Clock, Lock,
  FileWarning, Ban, TrendingDown, AlertCircle, ExternalLink, Gavel,
  Scale, Landmark, CreditCard
} from "lucide-react";
import Testimonials from "./Testimonials";
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

interface ResultScreenProps {
  nome: string;
  nascimento: string;
  sexo: string;
  cpf: string;
  pendencias: Pendencia[];
  onBack: () => void;
  onRegularizar: () => void;
  onTabChange?: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length < 2) return parts[0]?.[0] || "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const generateProtocolo = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
};

const getPrazoFinal = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("pt-BR");
};

const ResultScreen = ({ nome, nascimento, sexo, cpf, pendencias, onBack, onRegularizar, onTabChange }: ResultScreenProps) => {
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [protocolo] = useState(generateProtocolo);
  const [prazo] = useState(getPrazoFinal);
  const [consultaTime] = useState(() => new Date().toLocaleString("pt-BR"));

  const totalGeral = pendencias.reduce((sum, p) => sum + p.valorTotal, 0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader nome={nome} cpf={cpf} />

      {/* Status banner */}
      <div className="w-full bg-destructive py-2 sm:py-2.5 text-center">
        <p className="text-[10px] sm:text-xs font-bold tracking-[0.12em] text-destructive-foreground uppercase px-4">
          Situação cadastral irregular — pendências identificadas
        </p>
      </div>

      {/* Consultation info bar */}
      <div className="w-full bg-primary/5 border-b border-border py-1.5 sm:py-2">
        <div className="mx-auto max-w-2xl px-4 flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
            <span>{consultaTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Shield className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
            <span>SERPRO/RFB</span>
          </div>
        </div>
      </div>

      <div className="flex-1 mx-auto max-w-2xl px-4 py-5 sm:py-8 animate-fade-in-up w-full">

        {/* CPF Status */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 sm:p-4 mb-3 sm:mb-4 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            <span className="text-xs sm:text-sm font-bold text-destructive uppercase tracking-wide">Situação Irregular</span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-destructive tabular-nums">{formatCpf(cpf)}</p>
        </div>

        {/* Person info */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-lg gradient-primary text-base sm:text-lg font-bold text-primary-foreground shadow-sm shrink-0">
              {getInitials(nome)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-foreground tracking-tight truncate">{nome}</h1>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {nascimento}</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {sexo === "M" ? "Masculino" : sexo === "F" ? "Feminino" : sexo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Protocolo + Prazo + Status */}
        <div className="rounded-xl border border-border bg-muted/50 p-2.5 sm:p-3 mb-3 sm:mb-4 shadow-sm">
          <div className="grid grid-cols-3 text-center divide-x divide-border">
            <div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Protocolo</p>
              <p className="font-bold text-primary text-[10px] sm:text-xs">{protocolo}</p>
            </div>
            <div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Prazo</p>
              <p className="font-bold text-destructive text-[10px] sm:text-xs">{prazo}</p>
            </div>
            <div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider font-medium">Status</p>
              <p className="font-bold text-destructive text-[10px] sm:text-xs">IRREGULAR</p>
            </div>
          </div>
        </div>

        {/* Pendências table */}
        {pendencias.length > 0 && (
          <div className="rounded-xl border border-border bg-card mb-3 sm:mb-4 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-2.5 sm:p-3 border-b border-border gradient-primary">
              <FileWarning className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
              <h3 className="font-bold text-primary-foreground text-xs sm:text-sm">Débitos Identificados ({pendencias.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {pendencias.map((p, i) => (
                <div key={i} className="p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive shrink-0" />
                      <span className="font-bold text-foreground text-[11px] sm:text-xs">Código {p.codigoReceita}</span>
                    </div>
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground font-mono">Ref: {p.numeroReferencia}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                    <div className="rounded bg-muted/50 p-1.5">
                      <p className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">Principal</p>
                      <p className="font-semibold text-foreground text-[11px] sm:text-xs">{formatCurrency(p.valorPrincipal)}</p>
                    </div>
                    <div className="rounded bg-destructive/5 p-1.5">
                      <p className="text-[8px] sm:text-[9px] text-destructive uppercase tracking-wider">Multa</p>
                      <p className="font-semibold text-destructive text-[11px] sm:text-xs">{formatCurrency(p.multa)}</p>
                    </div>
                    <div className="rounded bg-destructive/5 p-1.5">
                      <p className="text-[8px] sm:text-[9px] text-destructive uppercase tracking-wider">Juros</p>
                      <p className="font-semibold text-destructive text-[11px] sm:text-xs">{formatCurrency(p.juros)}</p>
                    </div>
                    <div className="rounded bg-destructive/10 p-1.5">
                      <p className="text-[8px] sm:text-[9px] text-destructive uppercase tracking-wider font-bold">Total</p>
                      <p className="font-bold text-destructive text-[11px] sm:text-xs">{formatCurrency(p.valorTotal)}</p>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    Vencimento: {p.dataVencimento}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2.5 sm:p-4 border-t-2 border-destructive/20 bg-destructive/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground uppercase tracking-wider text-[11px] sm:text-sm">Valor Total Devido</span>
                <span className="text-lg sm:text-xl font-extrabold text-destructive tabular-nums">{formatCurrency(totalGeral)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Countdown */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 mb-3 sm:mb-4 text-center shadow-sm">
          <p className="font-semibold text-foreground mb-2.5 uppercase tracking-wider text-[10px] sm:text-xs flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-destructive" />
            Prazo para regularização administrativa
          </p>
          <div className="flex items-center justify-center gap-2">
            {[
              { value: countdown.hours, label: "Horas" },
              { value: countdown.minutes, label: "Min" },
              { value: countdown.seconds, label: "Seg" },
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-lg border border-border bg-muted/50">
                  <span className="text-base sm:text-lg font-bold text-destructive font-mono tabular-nums">{pad(unit.value)}</span>
                </div>
                <span className="mt-0.5 text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-wider">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Informativo — consequências */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Gavel className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" />
            <h3 className="font-bold text-foreground uppercase tracking-wide text-[11px] sm:text-xs">Informativo — Consequências do Não Pagamento</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {[
              { icon: AlertTriangle, text: "Multa de ofício de 75% a 150% sobre o valor devido (Art. 44, Lei 9.430/96)" },
              { icon: TrendingDown, text: "Incidência de juros equivalentes à taxa SELIC acumulada" },
              { icon: Lock, text: "Suspensão do CPF junto à Receita Federal do Brasil" },
              { icon: Landmark, text: "Inscrição em Dívida Ativa da União (PGFN)" },
              { icon: Scale, text: "Execução fiscal com possibilidade de penhora de bens e bloqueio de contas" },
              { icon: Ban, text: "Restrição de acesso a benefícios sociais e previdenciários" },
              { icon: CreditCard, text: "Negativação nos cadastros de proteção ao crédito (SPC/Serasa)" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/30 p-2 border border-border/50">
                <item.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-[10px] sm:text-[11px] text-muted-foreground leading-snug">{item.text}</span>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed border-t border-border pt-2">
            Base legal: Lei nº 9.430/96, Decreto-Lei nº 1.736/79, Lei nº 6.830/80. A regularização dentro do prazo administrativo evita a inscrição em Dívida Ativa e a execução fiscal.
          </p>
        </div>

        {/* CTA */}
        <button onClick={onRegularizar} className="w-full rounded-xl gradient-accent py-3.5 sm:py-4 text-xs sm:text-sm font-bold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-md active:scale-[0.98] mb-1">
          EMITIR DARF — REGULARIZAR SITUAÇÃO FISCAL
          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <p className="text-center text-[9px] sm:text-[10px] text-muted-foreground mb-4 sm:mb-5">
          Prazo final para regularização administrativa: {prazo}
        </p>

        <hr className="border-border mb-3 sm:mb-4" />

        <div className="mb-3 sm:mb-4">
          <Testimonials />
        </div>

        {/* Second CTA */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 sm:p-4 mb-3 text-center">
          <p className="text-[10px] sm:text-xs text-foreground leading-relaxed mb-2.5">
            O não pagamento no prazo estabelecido acarretará a aplicação automática de multa, juros e possível inscrição em Dívida Ativa da União, conforme legislação vigente.
          </p>
          <button onClick={onRegularizar} className="w-full rounded-lg gradient-accent py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]">
            REGULARIZAR CPF
            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>

        <button
          onClick={onBack}
          className="mt-1 w-full text-center text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Nova consulta
        </button>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default ResultScreen;
