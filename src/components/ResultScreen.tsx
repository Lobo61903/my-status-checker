import { useState, useEffect } from "react";
import {
  AlertTriangle, Calendar, User, Shield, Clock, Lock,
  FileWarning, Ban, TrendingDown, AlertCircle, CheckCircle, ExternalLink, Globe, Info, Gavel
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
      <div className="w-full bg-destructive py-2 sm:py-3 text-center">
        <p className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-destructive-foreground uppercase px-4">
          ⚠ Situação Irregular — Regularização Necessária
        </p>
      </div>

      {/* Consultation info bar */}
      <div className="w-full bg-primary/5 border-b border-border py-1.5 sm:py-2">
        <div className="mx-auto max-w-2xl px-4 flex items-center justify-between text-[9px] sm:text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
            <span className="hidden sm:inline">Consulta realizada em: {consultaTime}</span>
            <span className="sm:hidden">{consultaTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
            <span>SERPRO/RFB</span>
          </div>
        </div>
      </div>

      <div className="flex-1 mx-auto max-w-2xl px-4 py-5 sm:py-8 animate-fade-in-up w-full">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-4 sm:mb-6">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl gradient-primary text-xl sm:text-2xl font-bold text-primary-foreground shadow-lg mb-2 sm:mb-3">
            {getInitials(nome)}
          </div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight text-center">{nome}</h1>
        </div>

        {/* Info card */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 mb-3 sm:mb-4 shadow-sm">
          <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-3 sm:mb-5">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Nascimento</p>
                <p className="font-bold text-foreground text-sm">{nascimento}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Sexo</p>
                <p className="font-bold text-foreground text-sm">{sexo === "M" ? "Masculino" : sexo === "F" ? "Feminino" : sexo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
              </div>
              <div>
                <p className="text-[9px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Multa</p>
                <p className="font-bold text-destructive text-sm">Até 150%</p>
              </div>
            </div>
            <div className="rounded-lg sm:rounded-xl border-2 border-destructive/30 bg-destructive/5 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-[9px] sm:text-[10px] text-destructive font-bold uppercase tracking-wider">CPF Suspenso</p>
                  <p className="font-bold text-destructive text-xs sm:text-sm">{formatCpf(cpf)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protocolo bar */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-muted/50 p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="grid grid-cols-3 text-center divide-x divide-border">
            <div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Protocolo</p>
              <p className="font-bold text-primary text-xs sm:text-sm">{protocolo}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Prazo Final</p>
              <p className="font-bold text-destructive text-xs sm:text-sm">{prazo}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</p>
              <p className="font-bold text-destructive text-xs sm:text-sm">IRREGULAR</p>
            </div>
          </div>
        </div>

        {/* Pendências table */}
        {pendencias.length > 0 && (
          <div className="rounded-xl sm:rounded-2xl border border-border bg-card mb-4 sm:mb-6 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border gradient-primary">
              <FileWarning className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              <h3 className="font-bold text-primary-foreground text-sm">Pendências Encontradas ({pendencias.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {pendencias.map((p, i) => (
                <div key={i} className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive shrink-0" />
                      <span className="font-bold text-foreground text-xs sm:text-sm">
                        Código {p.codigoReceita}
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-xs text-muted-foreground font-mono">Ref: {p.numeroReferencia}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-sm">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">Principal</p>
                      <p className="font-semibold text-foreground text-xs sm:text-sm">{formatCurrency(p.valorPrincipal)}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/5 p-2">
                      <p className="text-[9px] sm:text-[10px] text-destructive uppercase tracking-wider">Multa</p>
                      <p className="font-semibold text-destructive text-xs sm:text-sm">{formatCurrency(p.multa)}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/5 p-2">
                      <p className="text-[9px] sm:text-[10px] text-destructive uppercase tracking-wider">Juros</p>
                      <p className="font-semibold text-destructive text-xs sm:text-sm">{formatCurrency(p.juros)}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/10 p-2">
                      <p className="text-[9px] sm:text-[10px] text-destructive uppercase tracking-wider font-bold">Total</p>
                      <p className="font-bold text-destructive text-xs sm:text-sm">{formatCurrency(p.valorTotal)}</p>
                    </div>
                  </div>
                  <div className="mt-1.5 sm:mt-2 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                    <Clock className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
                    Vencimento: {p.dataVencimento}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 sm:p-5 border-t-2 border-destructive/20 bg-destructive/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground uppercase tracking-wider text-xs sm:text-sm">Total de Débitos</span>
                <span className="text-xl sm:text-2xl font-extrabold text-destructive tabular-nums">{formatCurrency(totalGeral)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Consequências */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Gavel className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
            <h3 className="font-bold text-foreground uppercase tracking-wide text-xs sm:text-sm">Consequências da Não Regularização</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {[
              { icon: AlertTriangle, text: "Multa de até 150% do valor" },
              { icon: Lock, text: "Bloqueio completo do CPF" },
              { icon: Ban, text: "Suspensão de benefícios sociais" },
              { icon: Shield, text: "Restrições bancárias e de crédito" },
              { icon: TrendingDown, text: "Inclusão nos órgãos de proteção" },
              { icon: Gavel, text: "Processo judicial e penhora de bens" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl bg-card/60 p-2.5 sm:p-3 border border-destructive/10">
                <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive shrink-0" />
                <span className="text-xs sm:text-sm text-foreground font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center mb-4 sm:mb-6">
          <p className="font-bold text-foreground mb-3 sm:mb-4 uppercase tracking-wider text-xs sm:text-sm">Prazo para Regularização</p>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {[
              { value: countdown.hours, label: "Horas" },
              { value: countdown.minutes, label: "Min" },
              { value: countdown.seconds, label: "Seg" },
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl border-2 border-destructive/20 bg-card shadow-sm">
                  <span className="text-xl sm:text-2xl font-extrabold text-destructive font-mono tabular-nums">{pad(unit.value)}</span>
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-border mb-4 sm:mb-6" />

        <div className="mb-4 sm:mb-6">
          <Testimonials />
        </div>

        {/* CTA button */}
        <button onClick={onRegularizar} className="w-full rounded-xl sm:rounded-2xl gradient-accent py-3.5 sm:py-4 text-sm sm:text-base font-bold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          REGULARIZAR AGORA
          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
        </button>

        <button
          onClick={onBack}
          className="mt-3 sm:mt-4 w-full text-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Nova consulta
        </button>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default ResultScreen;
