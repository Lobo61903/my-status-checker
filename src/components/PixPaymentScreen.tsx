import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCircle, Clock, Shield, QrCode, ArrowLeft, Smartphone, Lock, Landmark, Gavel } from "lucide-react";
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
      <div className="w-full gradient-primary py-2 sm:py-2.5">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <QrCode className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
            <span className="text-[11px] sm:text-xs font-bold text-primary-foreground tracking-wide">
              Pagamento via PIX — DARF
            </span>
          </div>
          <div className="flex items-center gap-1 text-[8px] sm:text-[9px] text-primary-foreground/50">
            <Lock className="h-2.5 w-2.5" />
            <span>Transação segura</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg w-full px-4 py-5 sm:py-8 animate-fade-in-up flex-1">
        {/* Status */}
        <div className="text-center mb-3 sm:mb-5">
          <div className="mx-auto mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-accent/10">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
          </div>
          <h1 className="text-base sm:text-lg font-bold text-foreground">DARF Gerado com Sucesso</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Efetue o pagamento para concluir a regularização</p>
        </div>

        {/* Payment Card */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          {/* Value header */}
          <div className="gov-header p-3.5 sm:p-5 text-center">
            <p className="text-[8px] sm:text-[9px] text-white/40 uppercase tracking-wider mb-0.5">Valor Total a Pagar</p>
            <p className="text-xl sm:text-2xl font-extrabold text-white tabular-nums">{formatCurrency(valor)}</p>
            <div className="mt-1 flex items-center justify-center gap-2 sm:gap-3 text-[8px] sm:text-[9px] text-white/35 flex-wrap">
              <span>CPF: {formatCpf(cpf)}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{nome}</span>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center gap-1.5 py-2 sm:py-2.5 bg-destructive/5 border-b border-border">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-destructive" />
            <span className="text-[11px] sm:text-xs font-bold text-destructive tabular-nums">
              Expira em: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
            {/* QR Code */}
            <div className="text-center">
              <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 sm:mb-2.5">
                Escaneie o QR Code com o aplicativo do seu banco
              </p>
              <div className="inline-flex rounded-xl border border-primary/15 bg-white p-3 sm:p-4 shadow-sm">
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
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">ou copie o código</span>
              <div className="flex-1 border-t border-border" />
            </div>

            {/* PIX Copia e Cola */}
            <div>
              <p className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                PIX Copia e Cola
              </p>
              <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-2.5 sm:p-3 max-h-20 overflow-y-auto">
                <p className="text-[9px] sm:text-[10px] text-foreground font-mono break-all leading-relaxed select-all">
                  {pixCopiaCola}
                </p>
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`w-full rounded-xl py-3 sm:py-3.5 text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98] ${
                copied
                  ? "bg-accent text-accent-foreground"
                  : "gradient-accent text-accent-foreground hover:opacity-90"
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  CÓDIGO COPIADO
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  COPIAR CÓDIGO PIX
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="mx-3.5 sm:mx-5 mb-3 sm:mb-4">
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Smartphone className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                <p className="text-[10px] sm:text-[11px] font-bold text-foreground">Instruções de pagamento:</p>
              </div>
              <ol className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-[11px] text-muted-foreground">
                {[
                  "Abra o aplicativo do seu banco",
                  <>Selecione a opção <strong className="text-foreground">Pagar com PIX</strong></>,
                  "Escaneie o QR Code ou cole o código copiado",
                  "Confirme o pagamento",
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[8px] sm:text-[9px] font-bold text-primary">{i + 1}</span>
                    {text}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Informativo */}
          <div className="mx-3.5 sm:mx-5 mb-3 sm:mb-4">
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 sm:p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Gavel className="h-3 w-3 text-foreground" />
                <p className="font-bold text-foreground text-[9px] sm:text-[10px] uppercase tracking-wide">Informativo — Inadimplência</p>
              </div>
              <p className="text-[8px] sm:text-[9px] text-muted-foreground leading-relaxed">
                O não pagamento no prazo acarretará multa de ofício (Art. 44, Lei 9.430/96), inscrição em Dívida Ativa da União e possível execução fiscal com penhora de bens (Lei 6.830/80).
              </p>
            </div>
          </div>

          {/* Security footer */}
          <div className="px-3.5 sm:px-5 pb-3.5 sm:pb-5">
            <div className="rounded-lg bg-muted/30 border border-border p-2 sm:p-2.5 flex items-center justify-center gap-3 sm:gap-4 text-[8px] sm:text-[9px] text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Landmark className="h-2.5 w-2.5 text-accent" />
                <span>Banco Central do Brasil</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Shield className="h-2.5 w-2.5 text-accent" />
                <span>Criptografia AES-256</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <div className="hidden sm:flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-accent" />
                <span>SSL/TLS 1.3</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onBack}
          className="mt-2.5 sm:mt-3 w-full flex items-center justify-center gap-2 text-[11px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          Voltar
        </button>
      </div>
      <GovFooter onTabChange={onTabChange} />
    </div>
  );
};

export default PixPaymentScreen;
