import { Lock, ShieldAlert, AlertTriangle } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface DeviceLockedScreenProps {
  cpf: string;
  onTabChange?: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const DeviceLockedScreen = ({ cpf, onTabChange }: DeviceLockedScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader cpf={cpf} />

      {/* Alert bar */}
      <div className="w-full bg-destructive/10 border-b border-destructive/20 py-1.5 sm:py-2">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-center gap-2 text-[9px] sm:text-xs text-destructive font-medium">
          <AlertTriangle className="h-2.5 sm:h-3 w-2.5 sm:w-3 shrink-0" />
          <span>ALERTA DE SEGURANÇA — Acesso negado por divergência de dispositivo</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg animate-fade-in-up">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
                <Lock className="h-9 w-9 sm:h-11 sm:w-11 text-destructive" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-destructive shadow-sm">
                <ShieldAlert className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight mb-2">
              Dispositivo Não Autorizado
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              CPF: <span className="font-mono font-semibold text-foreground">{formatCpf(cpf)}</span>
            </p>
          </div>

          {/* Main card */}
          <div className="rounded-xl sm:rounded-2xl border border-destructive/20 bg-card shadow-sm overflow-hidden mb-4">
            <div className="bg-destructive/8 border-b border-destructive/15 px-4 sm:px-5 py-3">
              <h2 className="text-xs sm:text-sm font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Acesso Bloqueado por Segurança
              </h2>
            </div>
            <div className="px-4 sm:px-5 py-4 space-y-3">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Este CPF já foi consultado e está vinculado a <strong className="text-foreground">outro dispositivo</strong>. Por determinação da Receita Federal, cada CPF pode ser consultado apenas pelo dispositivo que realizou o primeiro acesso.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Essa medida impede o acesso não autorizado a informações fiscais e protege seus dados tributários.
              </p>
            </div>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <h3 className="text-[10px] sm:text-xs font-bold text-foreground mb-1">O que fazer?</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                Acesse este portal pelo dispositivo (celular ou computador) onde o CPF foi consultado pela primeira vez.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
              <h3 className="text-[10px] sm:text-xs font-bold text-foreground mb-1">Precisa de ajuda?</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                Entre em contato com o suporte da Receita Federal pelo 0800 722 4350 (seg–sex, 8h–20h).
              </p>
            </div>
          </div>

          {/* Protocol */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-center">
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 font-mono">
              Protocolo de segurança: SEC-{Date.now().toString(36).toUpperCase()} · Registro automático gerado
            </p>
          </div>

        </div>
      </div>

      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default DeviceLockedScreen;
