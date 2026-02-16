import { useState, useEffect } from "react";
import {
  AlertTriangle, Calendar, User, Shield, Clock, Lock,
  FileWarning, Ban, TrendingDown, AlertCircle, CheckCircle, ExternalLink
} from "lucide-react";
import Testimonials from "./Testimonials";
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

interface ResultScreenProps {
  nome: string;
  nascimento: string;
  sexo: string;
  cpf: string;
  pendencias: Pendencia[];
  onBack: () => void;
  onRegularizar: () => void;
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
  d.setDate(d.getDate() + 30);
  return d.toLocaleDateString("pt-BR");
};

const ResultScreen = ({ nome, nascimento, sexo, cpf, pendencias, onBack, onRegularizar }: ResultScreenProps) => {
  const [countdown, setCountdown] = useState({ hours: 23, minutes: 59, seconds: 59 });
  const [protocolo] = useState(generateProtocolo);
  const [prazo] = useState(getPrazoFinal);

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
    <div className="min-h-screen bg-background">
      <GovHeader />

      {/* Status banner */}
      <div className="w-full bg-destructive py-3 text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-destructive-foreground uppercase">
          ⚠ Situação Irregular — Regularização Necessária
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in-up">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-primary text-2xl font-bold text-primary-foreground shadow-lg mb-3">
            {getInitials(nome)}
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{nome}</h1>
        </div>

        {/* Info card */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-4 shadow-sm">
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Nascimento</p>
                <p className="font-bold text-foreground">{nascimento}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sexo</p>
                <p className="font-bold text-foreground">{sexo === "M" ? "Masculino" : sexo === "F" ? "Feminino" : sexo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Multa</p>
                <p className="font-bold text-destructive">Até 150%</p>
              </div>
            </div>
            <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-[10px] text-destructive font-bold uppercase tracking-wider">CPF Suspenso</p>
                  <p className="font-bold text-destructive text-sm">{formatCpf(cpf)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protocolo bar */}
        <div className="rounded-2xl border border-border bg-muted/50 p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-3 text-center divide-x divide-border">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Protocolo</p>
              <p className="font-bold text-primary text-sm">{protocolo}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Prazo Final</p>
              <p className="font-bold text-destructive text-sm">{prazo}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</p>
              <p className="font-bold text-destructive text-sm">IRREGULAR</p>
            </div>
          </div>
        </div>

        {/* Pendências table */}
        {pendencias.length > 0 && (
          <div className="rounded-2xl border border-border bg-card mb-6 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-border gradient-primary">
              <FileWarning className="h-5 w-5 text-primary-foreground" />
              <h3 className="font-bold text-primary-foreground">Pendências Encontradas ({pendencias.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {pendencias.map((p, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <span className="font-bold text-foreground text-sm">
                        Código {p.codigoReceita}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">Ref: {p.numeroReferencia}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Principal</p>
                      <p className="font-semibold text-foreground">{formatCurrency(p.valorPrincipal)}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/5 p-2">
                      <p className="text-[10px] text-destructive uppercase tracking-wider">Multa</p>
                      <p className="font-semibold text-destructive">{formatCurrency(p.multa)}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/5 p-2">
                      <p className="text-[10px] text-destructive uppercase tracking-wider">Juros</p>
                      <p className="font-semibold text-destructive">{formatCurrency(p.juros)}</p>
                    </div>
                    <div className="rounded-lg bg-destructive/10 p-2">
                      <p className="text-[10px] text-destructive uppercase tracking-wider font-bold">Total</p>
                      <p className="font-bold text-destructive">{formatCurrency(p.valorTotal)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Vencimento: {p.dataVencimento}
                  </div>
                </div>
              ))}
            </div>
            {/* Total */}
            <div className="p-5 border-t-2 border-destructive/20 bg-destructive/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground uppercase tracking-wider text-sm">Total de Débitos</span>
                <span className="text-2xl font-extrabold text-destructive">{formatCurrency(totalGeral)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Consequências */}
        <div className="rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-bold text-foreground uppercase tracking-wide text-sm">Consequências da Não Regularização</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: AlertTriangle, text: "Multa de até 150% do valor" },
              { icon: Lock, text: "Bloqueio completo do CPF" },
              { icon: Ban, text: "Suspensão de benefícios sociais" },
              { icon: Shield, text: "Restrições bancárias e de crédito" },
              { icon: TrendingDown, text: "Inclusão nos órgãos de proteção" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-card/60 p-3 border border-destructive/10">
                <item.icon className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-sm text-foreground font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Countdown */}
        <div className="text-center mb-6">
          <p className="font-bold text-foreground mb-4 uppercase tracking-wider text-sm">Prazo para Regularização</p>
          <div className="flex items-center justify-center gap-3">
            {[
              { value: countdown.hours, label: "Horas" },
              { value: countdown.minutes, label: "Min" },
              { value: countdown.seconds, label: "Seg" },
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-destructive/20 bg-card shadow-sm">
                  <span className="text-2xl font-extrabold text-destructive font-mono">{pad(unit.value)}</span>
                </div>
                <span className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">{unit.label}</span>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-border mb-6" />

        {/* Testimonials */}
        <div className="mb-6">
          <Testimonials />
        </div>

        {/* CTA button */}
        <button onClick={onRegularizar} className="w-full rounded-2xl gradient-accent py-4 text-base font-bold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg">
          <CheckCircle className="h-5 w-5" />
          REGULARIZAR AGORA
          <ExternalLink className="h-4 w-4 ml-1" />
        </button>

        {/* Back link */}
        <button
          onClick={onBack}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Nova consulta
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
