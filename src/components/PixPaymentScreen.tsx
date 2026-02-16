import { useState, useEffect } from "react";
import { Copy, CheckCircle, Clock, Shield, QrCode, ArrowLeft, AlertTriangle } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface PixPaymentScreenProps {
  nome: string;
  cpf: string;
  valor: number;
  pixCopiaCola: string;
  onBack: () => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const PixPaymentScreen = ({ nome, cpf, valor, pixCopiaCola, onBack }: PixPaymentScreenProps) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCopiaCola);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = pixCopiaCola;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader nome={nome} cpf={cpf} />

      {/* Title bar */}
      <div className="w-full gradient-primary py-3">
        <div className="mx-auto max-w-3xl px-4 flex items-center gap-2">
          <QrCode className="h-4 w-4 text-primary-foreground" />
          <span className="text-sm font-bold text-primary-foreground tracking-wide">
            Pagamento via PIX - DARF
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-lg w-full px-4 py-8 animate-fade-in-up">
        {/* Status */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <CheckCircle className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">DARF Gerado com Sucesso</h1>
          <p className="text-sm text-muted-foreground mt-1">Efetue o pagamento via PIX para regularizar</p>
        </div>

        {/* Payment Card */}
        <div className="rounded-2xl border border-border bg-card shadow-md overflow-hidden">
          {/* Value header */}
          <div className="gov-header p-5 text-center">
            <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Valor a Pagar</p>
            <p className="text-3xl font-extrabold text-white">{formatCurrency(valor)}</p>
            <p className="text-xs text-white/50 mt-1">CPF: {formatCpf(cpf)}</p>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 py-3 bg-destructive/5 border-b border-border">
            <Clock className="h-4 w-4 text-destructive" />
            <span className="text-sm font-bold text-destructive">
              Expira em: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          {/* PIX Copia e Cola */}
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                PIX Copia e Cola
              </p>
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                <p className="text-xs text-foreground font-mono break-all leading-relaxed">
                  {pixCopiaCola}
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full rounded-2xl py-4 text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                copied
                  ? "bg-accent text-accent-foreground"
                  : "gradient-accent text-accent-foreground hover:opacity-90"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  CÓDIGO COPIADO!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  COPIAR CÓDIGO PIX
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mx-5 mb-5">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-xs font-bold text-foreground mb-2">Como pagar:</p>
              <ol className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Abra o aplicativo do seu banco
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Escolha a opção <strong className="text-foreground">Pagar com PIX</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  Selecione <strong className="text-foreground">PIX Copia e Cola</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">4.</span>
                  Cole o código copiado e confirme o pagamento
                </li>
              </ol>
            </div>
          </div>

          {/* Warning */}
          <div className="mx-5 mb-5">
            <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Atenção:</strong> O não pagamento até o vencimento resultará em acréscimo de multa e juros, além da inscrição em Dívida Ativa da União.
                </p>
              </div>
            </div>
          </div>

          {/* Security footer */}
          <div className="px-5 pb-5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>Pagamento processado pelo Banco Central do Brasil</span>
            </div>
          </div>
        </div>

        {/* Back */}
        <button
          onClick={onBack}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
      </div>
      <GovFooter />
    </div>
  );
};

export default PixPaymentScreen;
