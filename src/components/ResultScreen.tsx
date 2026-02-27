import { useState, useEffect } from "react";
import {
  AlertTriangle, Calendar, User, Shield, Clock, Lock,
  FileWarning, Ban, TrendingDown, AlertCircle, ExternalLink, Gavel,
  XCircle, Skull, Scale, Landmark, CreditCard, ShieldX
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

      {/* Critical status banner */}
      <div className="w-full bg-destructive py-3 sm:py-4 text-center animate-pulse">
        <p className="text-xs sm:text-sm font-extrabold tracking-[0.15em] sm:tracking-[0.2em] text-destructive-foreground uppercase px-4">
          🚨 CPF EM SITUAÇÃO IRREGULAR — RISCO DE BLOQUEIO IMINENTE
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
            <span>SERPRO/RFB — Dados Oficiais</span>
          </div>
        </div>
      </div>

      <div className="flex-1 mx-auto max-w-2xl px-4 py-5 sm:py-8 animate-fade-in-up w-full">

        {/* CPF Status Alert - Prominent */}
        <div className="rounded-2xl border-2 border-destructive bg-destructive/10 p-4 sm:p-5 mb-4 sm:mb-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <XCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
          </div>
          <h2 className="text-base sm:text-xl font-extrabold text-destructive uppercase tracking-wide mb-1">
            CPF Irregular
          </h2>
          <p className="text-lg sm:text-2xl font-extrabold text-destructive tabular-nums mb-1">{formatCpf(cpf)}</p>
          <p className="text-[10px] sm:text-xs text-destructive/80 font-semibold">
            Pendências fiscais detectadas no sistema da Receita Federal
          </p>
        </div>

        {/* Person info - compact */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 mb-3 sm:mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl gradient-primary text-lg sm:text-xl font-bold text-primary-foreground shadow-md shrink-0">
              {getInitials(nome)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-lg font-extrabold text-foreground tracking-tight truncate">{nome}</h1>
              <div className="flex items-center gap-3 mt-0.5 text-[10px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {nascimento}</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {sexo === "M" ? "Masculino" : sexo === "F" ? "Feminino" : sexo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Protocolo + Prazo + Status */}
        <div className="rounded-xl border border-border bg-muted/50 p-3 sm:p-4 mb-4 sm:mb-5 shadow-sm">
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

        {/* Countdown - urgent */}
        <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 sm:p-5 mb-4 sm:mb-5 text-center">
          <p className="font-bold text-destructive mb-3 uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-1.5">
            <Clock className="h-4 w-4 animate-pulse" />
            Tempo Restante para Regularização
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {[
              { value: countdown.hours, label: "Horas" },
              { value: countdown.minutes, label: "Min" },
              { value: countdown.seconds, label: "Seg" },
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl border-2 border-destructive/30 bg-card shadow-sm">
                  <span className="text-xl sm:text-2xl font-extrabold text-destructive font-mono tabular-nums">{pad(unit.value)}</span>
                </div>
                <span className="mt-1 text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">{unit.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10px] sm:text-xs text-destructive font-semibold">
            Após o prazo, o débito será acrescido de multa de 20% + juros SELIC
          </p>
        </div>

        {/* First CTA */}
        <button onClick={onRegularizar} className="w-full rounded-xl sm:rounded-2xl gradient-accent py-4 sm:py-5 text-sm sm:text-base font-extrabold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] mb-1">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
          EMITIR DARF E REGULARIZAR AGORA
          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
        </button>
        <p className="text-center text-[10px] sm:text-xs text-destructive font-semibold mb-5 sm:mb-6">
          ⚠ Regularize HOJE e evite bloqueio definitivo do seu CPF
        </p>

        {/* Pendências table */}
        {pendencias.length > 0 && (
          <div className="rounded-xl sm:rounded-2xl border border-border bg-card mb-4 sm:mb-5 shadow-sm overflow-hidden">
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

        {/* O QUE ACONTECE SE NÃO PAGAR - expanded warnings */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 sm:p-6 mb-4 sm:mb-5">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Skull className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            <h3 className="font-extrabold text-destructive uppercase tracking-wide text-sm sm:text-base">O Que Acontece Se Você Não Pagar</h3>
          </div>
          <div className="space-y-2 sm:space-y-2.5">
            {[
              { icon: AlertTriangle, title: "Multa de até 150%", desc: "Aplicada automaticamente sobre o valor original do débito" },
              { icon: TrendingDown, title: "Juros SELIC acumulados", desc: "Cobrados diariamente até a quitação total" },
              { icon: Lock, title: "Bloqueio definitivo do CPF", desc: "Impossibilidade de abrir conta, financiamento ou cartão" },
              { icon: Landmark, title: "Inscrição em Dívida Ativa da União", desc: "Seu nome será inscrito junto à PGFN para cobrança judicial" },
              { icon: Scale, title: "Execução fiscal e penhora de bens", desc: "Bloqueio de contas bancárias, veículos e imóveis" },
              { icon: Ban, title: "Suspensão de benefícios", desc: "INSS, Bolsa Família e demais benefícios sociais suspensos" },
              { icon: CreditCard, title: "Restrição total de crédito", desc: "Nome negativado em SPC, Serasa e demais órgãos" },
              { icon: ShieldX, title: "Impedimento de emitir certidões", desc: "Impossibilidade de participar de licitações e concursos" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 sm:gap-3 rounded-lg bg-card/80 p-2.5 sm:p-3 border border-destructive/10">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-foreground">{item.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legal warning */}
        <div className="rounded-xl border border-destructive/20 bg-card p-3 sm:p-4 mb-4 sm:mb-5">
          <div className="flex items-start gap-2">
            <Gavel className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-foreground mb-1">Fundamentação Legal</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                Art. 44 da Lei nº 9.430/96 — multa de ofício de 75% a 150%. Art. 7º do Decreto-Lei nº 1.736/79 — inscrição automática em Dívida Ativa após esgotamento do prazo administrativo. 
                Lei nº 6.830/80 — execução fiscal com penhora de bens, bloqueio de contas (BacenJud) e restrição patrimonial.
              </p>
            </div>
          </div>
        </div>

        <hr className="border-border mb-4 sm:mb-5" />

        <div className="mb-4 sm:mb-5">
          <Testimonials />
        </div>

        {/* Final CTA */}
        <div className="rounded-xl sm:rounded-2xl border-2 border-destructive bg-destructive/10 p-4 sm:p-5 mb-3 text-center">
          <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-destructive mx-auto mb-2 animate-pulse" />
          <h3 className="font-extrabold text-destructive uppercase tracking-wide text-sm sm:text-base mb-1">
            Não Ignore Esta Notificação
          </h3>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed mb-3">
            O <strong>não pagamento</strong> dentro do prazo resulta em <strong>bloqueio definitivo do CPF</strong>, 
            inscrição em <strong>Dívida Ativa</strong> e possível <strong>penhora judicial de bens</strong>.
          </p>
          <button onClick={onRegularizar} className="w-full rounded-xl gradient-accent py-4 sm:py-5 text-sm sm:text-base font-extrabold text-accent-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
            REGULARIZAR CPF AGORA — EVITE O BLOQUEIO
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
          </button>
          <p className="text-[10px] sm:text-xs text-destructive font-semibold mt-2">
            Prazo final: {prazo} — Após essa data, multa adicional será aplicada automaticamente
          </p>
        </div>

        <button
          onClick={onBack}
          className="mt-1 sm:mt-2 w-full text-center text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Nova consulta
        </button>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default ResultScreen;
