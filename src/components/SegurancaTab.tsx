import { Shield, Lock, Eye, Smartphone, WifiOff, AlertTriangle, KeyRound } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface SegurancaTabProps {
  onTabChange: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const tips = [
  {
    icon: Lock,
    title: "Nunca compartilhe seu CPF",
    desc: "Não envie seu CPF por mensagens, redes sociais ou sites não confiáveis.",
  },
  {
    icon: Eye,
    title: "Verifique o endereço do site",
    desc: "Sempre confira se o site possui certificado SSL (cadeado) e domínio oficial.",
  },
  {
    icon: Smartphone,
    title: "Mantenha seu dispositivo seguro",
    desc: "Use senhas fortes, biometria e mantenha seu sistema atualizado.",
  },
  {
    icon: WifiOff,
    title: "Evite redes Wi-Fi públicas",
    desc: "Não acesse dados sensíveis em redes abertas. Use dados móveis quando possível.",
  },
  {
    icon: AlertTriangle,
    title: "Desconfie de mensagens urgentes",
    desc: "Golpistas usam urgência para enganar. A Receita Federal não envia cobranças por SMS.",
  },
  {
    icon: KeyRound,
    title: "Use autenticação em dois fatores",
    desc: "Ative a verificação em 2 etapas em todas as suas contas governamentais.",
  },
];

const SegurancaTab = ({ onTabChange }: SegurancaTabProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-dark))] to-primary p-5 text-white shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold leading-tight">Dicas de Segurança</h1>
                <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
                  Proteja seus dados e evite fraudes
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <tip.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{tip.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                      {tip.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <GovFooter activeTab="seguranca" onTabChange={onTabChange} />
    </div>
  );
};

export default SegurancaTab;
