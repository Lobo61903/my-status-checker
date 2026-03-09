import { HelpCircle, Search, FileText, CreditCard, QrCode, CheckCircle } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface AjudaTabProps {
  onTabChange: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const steps = [
  {
    icon: Search,
    step: "1",
    title: "Informe seu CPF",
    desc: "Na tela inicial, digite seu CPF no campo indicado e complete a verificação de segurança (reCAPTCHA).",
  },
  {
    icon: FileText,
    step: "2",
    title: "Aguarde a consulta",
    desc: "O sistema irá consultar sua situação em tempo real junto à base de dados da Receita Federal via SERPRO.",
  },
  {
    icon: FileText,
    step: "3",
    title: "Visualize suas pendências",
    desc: "Serão exibidas todas as pendências encontradas, incluindo valores de multas e juros acumulados.",
  },
  {
    icon: CreditCard,
    step: "4",
    title: "Gere o DARF",
    desc: "Clique em 'Regularizar' para visualizar o Documento de Arrecadação de Receitas Federais (DARF) com os valores detalhados.",
  },
  {
    icon: QrCode,
    step: "5",
    title: "Efetue o pagamento via PIX",
    desc: "Copie o código PIX gerado ou escaneie o QR Code para realizar o pagamento de forma rápida e segura.",
  },
  {
    icon: CheckCircle,
    step: "6",
    title: "Confirmação",
    desc: "Após o pagamento, sua situação será regularizada em até 72 horas úteis no sistema da Receita Federal.",
  },
];

const AjudaTab = ({ onTabChange }: AjudaTabProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-dark))] to-primary p-5 text-white shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold leading-tight">Central de Ajuda</h1>
                <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
                  Passo a passo para utilizar o sistema
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-extrabold text-primary">{s.step}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{s.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <GovFooter activeTab="ajuda" onTabChange={onTabChange} />
    </div>
  );
};

export default AjudaTab;
