import { useState, useEffect } from "react";
import {
  AlertTriangle, Calendar, User, Shield, Clock, Lock,
  FileWarning, Ban, TrendingDown, AlertCircle, CheckCircle
} from "lucide-react";
import Testimonials from "./Testimonials";

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

const ResultScreen = ({ nome, nascimento, sexo, cpf, pendencias, onBack }: ResultScreenProps) => {
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
      {/* Status banner */}
      <div className="w-full bg-destructive py-3 text-center">
        <p className="text-sm font-bold tracking-wide text-destructive-foreground">
          STATUS CRÍTICO: REGULARIZAÇÃO NECESSÁRIA
        </p>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in-up">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
            {getInitials(nome)}
          </div>
        </div>

        <h1 className="text-center text-2xl font-bold text-foreground mb-6">{nome}</h1>

        {/* Info grid */}
        <div className="rounded-xl border border-border bg-card p-5 mb-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                <p className="font-semibold text-foreground">{nascimento}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Sexo</p>
                <p className="font-semibold text-foreground">{sexo === "M" ? "M - Masculino" : sexo === "F" ? "F - Feminino" : sexo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Multa</p>
                <p className="font-semibold text-foreground">Até 150%</p>
              </div>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-xs text-destructive font-medium">CPF (SUSPENSO)</p>
                  <p className="font-semibold text-destructive">{formatCpf(cpf)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protocolo bar */}
        <div className="rounded-xl border border-border bg-muted p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Protocolo</p>
              <p className="font-bold text-primary">{protocolo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prazo Final</p>
              <p className="font-bold text-destructive">{prazo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-bold text-destructive">CRÍTICO</p>
            </div>
          </div>
        </div>

        {/* Pendências table */}
        {pendencias.length > 0 && (
          <div className="rounded-xl border border-border bg-card mb-6 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/50">
              <FileWarning className="h-5 w-5 text-warning" />
              <h3 className="font-bold text-foreground">Pendências Encontradas ({pendencias.length})</h3>
            </div>
            <div className="divide-y divide-border">
              {pendencias.map((p, i) => (
                <div key={i} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <span className="font-semibold text-foreground text-sm">
                        Código Receita: {p.codigoReceita}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">Ref: {p.numeroReferencia}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Principal</p>
                      <p className="font-medium text-foreground">{formatCurrency(p.valorPrincipal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Multa</p>
                      <p className="font-medium text-destructive">{formatCurrency(p.multa)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Juros</p>
                      <p className="font-medium text-destructive">{formatCurrency(p.juros)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
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
            <div className="p-4 border-t border-border bg-destructive/5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Total de Débitos</span>
                <span className="text-xl font-bold text-destructive">{formatCurrency(totalGeral)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Consequências */}
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="font-bold text-foreground">Consequências Imediatas</h3>
          </div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              Multa até 150%
            </li>
            <li className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-destructive shrink-0" />
              Bloqueio completo do CPF
            </li>
            <li className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-destructive shrink-0" />
              Suspensão de benefícios
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-destructive shrink-0" />
              Restrições bancárias
            </li>
            <li className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
              Inclusão no SERASA
            </li>
          </ul>
        </div>

        {/* Countdown */}
        <div className="text-center mb-6">
          <p className="font-bold text-foreground mb-3">Tempo Restante para Regularização</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-3xl font-bold text-destructive">{pad(countdown.hours)}</p>
              <p className="text-xs text-muted-foreground">Horas</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-destructive">{pad(countdown.minutes)}</p>
              <p className="text-xs text-muted-foreground">Minutos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-destructive">{pad(countdown.seconds)}</p>
              <p className="text-xs text-muted-foreground">Segundos</p>
            </div>
          </div>
        </div>

        <hr className="border-border mb-6" />

        {/* Testimonials */}
        <div className="mb-6">
          <Testimonials />
        </div>

        {/* CTA button */}
        <button className="w-full rounded-xl bg-accent py-4 text-base font-bold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2">
          <CheckCircle className="h-5 w-5" />
          REGULARIZAR AGORA
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
