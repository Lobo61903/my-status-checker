import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCircle, Clock, Shield, QrCode, ArrowLeft, AlertTriangle, Smartphone, Lock } from "lucide-react";
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
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixCopiaCola);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = pixCopiaCola;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader nome={nome} cpf={cpf} />

      {/* Title bar */}
      <div className="w-full gradient-primary py-3">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-primary-foreground" />
            <span className="text-sm font-bold text-primary-foreground tracking-wide">
              Pagamento via PIX - DARF
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-primary-foreground/60">
            <Lock className="h-3 w-3" />
            <span>Transação segura</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg w-full px-4 py-8 animate-fade-in-up">
        {/* Status */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <CheckCircle className="h-7 w-7 text-accent" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground">DARF Gerado com Sucesso</h1>
          <p className="text-sm text-muted-foreground mt-1">Efetue o pagamento via PIX para regularizar sua situação</p>
        </div>

        {/* Payment Card */}
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          {/* Value header */}
          <div className="gov-header p-6 text-center">
            <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Valor Total a Pagar</p>
            <p className="text-3xl font-extrabold text-white tabular-nums">{formatCurrency(valor)}</p>
            <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-white/40">
              <span>CPF: {formatCpf(cpf)}</span>
              <span>•</span>
              <span>{nome}</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-2 py-3 bg-destructive/5 border-b border-border">
            <Clock className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-sm font-bold text-destructive tabular-nums">
              Expira em: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          <div className="p-6 space-y-5">
            {/* QR Code */}
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Escaneie o QR Code
              </p>
              <div className="inline-flex rounded-2xl border-2 border-primary/20 bg-white p-4 shadow-sm">
                <QRCodeSVG
                  value={pixCopiaCola}
                  size={200}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Aponte a câmera do seu banco para o código acima
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ou copie o código</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* PIX Copia e Cola */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                PIX Copia e Cola
              </p>
              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 max-h-24 overflow-y-auto">
                <p className="text-[11px] text-foreground font-mono break-all leading-relaxed select-all">
                  {pixCopiaCola}
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full rounded-2xl py-4 text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                copied
                  ? "bg-accent text-accent-foreground"
                  : "gradient-accent text-accent-foreground hover:opacity-90 hover:shadow-xl"
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
          <div className="mx-6 mb-5">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Smartphone className="h-4 w-4 text-primary" />
                <p className="text-xs font-bold text-foreground">Como pagar:</p>
              </div>
              <ol className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">1</span>
                  Abra o aplicativo do seu banco
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">2</span>
                  Escolha <strong className="text-foreground">Pagar com PIX</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">3</span>
                  Escaneie o QR Code ou cole o código copiado
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">4</span>
                  Confirme o pagamento
                </li>
              </ol>
            </div>
          </div>

          {/* Warning */}
          <div className="mx-6 mb-5">
            <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Atenção:</strong> O não pagamento até o vencimento resultará em acréscimo de multa de 20%, juros SELIC e inscrição em Dívida Ativa da União.
                </p>
              </div>
            </div>
          </div>

          {/* Security footer */}
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-muted/30 border border-border p-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-accent" />
                <span>Banco Central do Brasil</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-accent" />
                <span>Criptografia AES-256</span>
              </div>
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
