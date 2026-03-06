import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Shield, CheckCircle, AlertTriangle, Loader2, User } from "lucide-react";
import GovHeader from "./GovHeader";
import GovFooter from "./GovFooter";

type Tab = "inicio" | "consultas" | "seguranca" | "ajuda";

interface ProvaDeVidaProps {
  cpf: string;
  onComplete: () => void;
  onBack: () => void;
  onTabChange: (tab: Tab) => void;
}

type Phase = "info" | "camera" | "capturing" | "analyzing" | "done";

const ProvaDeVida = ({ cpf, onComplete, onBack, onTabChange }: ProvaDeVidaProps) => {
  const [phase, setPhase] = useState<Phase>("info");
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPhase("camera");
    } catch {
      setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
    }
  };

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
    }
    stopCamera();
    setPhase("analyzing");

    // Simulate analysis
    setTimeout(() => {
      setPhase("done");
      setTimeout(() => {
        onComplete();
      }, 1500);
    }, 3000);
  }, [stopCamera, onComplete]);

  const formatCpf = (v: string) => {
    if (v.length !== 11) return v;
    return `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-4 max-w-lg mx-auto">

          {/* Title card */}
          <div className="rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-dark))] to-primary p-5 text-white shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[15px] font-extrabold leading-tight">
                  Prova de Vida Digital
                </h1>
                <p className="mt-1 text-[11px] text-white/60 leading-relaxed">
                  Verificação biométrica obrigatória para consulta de benefícios — CPF: {formatCpf(cpf)}
                </p>
              </div>
            </div>
          </div>

          {/* Info phase */}
          {phase === "info" && (
            <>
              <div className="flex items-center gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-[11px] text-destructive font-medium leading-snug">
                  A prova de vida é obrigatória conforme Portaria INSS nº 1.199/2022
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-lg space-y-4">
                <h2 className="text-sm font-bold text-foreground">Como funciona</h2>
                <div className="space-y-3">
                  {[
                    { step: "1", text: "Posicione seu rosto no centro da câmera" },
                    { step: "2", text: "Mantenha boa iluminação no ambiente" },
                    { step: "3", text: "Aguarde a captura automática" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {item.step}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-1">{item.text}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={startCamera}
                  className="w-full rounded-xl gradient-primary px-4 py-4 text-[14px] font-bold text-primary-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg active:scale-[0.97]"
                >
                  <Camera className="h-5 w-5" />
                  Iniciar Prova de Vida
                </button>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 border border-destructive/20 px-3.5 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-[11px] text-destructive font-medium">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-4 py-2 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-accent" />
                  <span>Dados protegidos</span>
                </div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-accent" />
                  <span>LGPD</span>
                </div>
              </div>
            </>
          )}

          {/* Camera phase */}
          {(phase === "camera" || phase === "capturing") && (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-lg space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4] max-h-[400px]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: "scaleX(-1)" }}
                />
                {/* Face guide overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 border-2 border-dashed border-white/50 rounded-[50%]" />
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="text-[11px] text-white/80 bg-black/50 px-3 py-1 rounded-full">
                    Posicione seu rosto dentro do oval
                  </span>
                </div>
              </div>

              <button
                onClick={capture}
                className="w-full rounded-xl gradient-primary px-4 py-4 text-[14px] font-bold text-primary-foreground transition-all hover:opacity-90 flex items-center justify-center gap-2 shadow-lg active:scale-[0.97]"
              >
                <Camera className="h-5 w-5" />
                Capturar Foto
              </button>
            </div>
          )}

          {/* Analyzing phase */}
          {phase === "analyzing" && (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg flex flex-col items-center gap-4">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <Loader2 className="absolute -top-1 -left-1 h-[72px] w-[72px] text-primary animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-foreground">Analisando biometria...</p>
                <p className="text-[11px] text-muted-foreground">
                  Verificando correspondência facial com a base de dados do DATAPREV
                </p>
              </div>
            </div>
          )}

          {/* Done phase */}
          {phase === "done" && (
            <div className="rounded-2xl border border-border bg-card p-8 shadow-lg flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-foreground">Prova de vida confirmada</p>
                <p className="text-[11px] text-muted-foreground">
                  Identidade verificada com sucesso. Consultando benefícios...
                </p>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
      <GovFooter activeTab="inicio" onTabChange={onTabChange} />
    </div>
  );
};

export default ProvaDeVida;
