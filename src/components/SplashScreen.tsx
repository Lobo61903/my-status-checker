import { useState, useEffect } from "react";
import logoImg from "@/assets/logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"logo" | "text" | "progress" | "done">("logo");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 400);
    const t2 = setTimeout(() => setPhase("progress"), 1000);
    const t3 = setTimeout(() => setPhase("done"), 2800);
    const t4 = setTimeout(() => onComplete(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  useEffect(() => {
    if (phase !== "progress") return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        return p + 2;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[hsl(var(--gov-dark))] transition-opacity duration-500 ${
        phase === "done" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Logo */}
      <div
        className={`transition-all duration-700 ease-out ${
          phase === "logo"
            ? "scale-50 opacity-0"
            : "scale-100 opacity-100"
        }`}
      >
        <img
          src={logoImg}
          alt="Logo"
          className="h-20 w-auto object-contain drop-shadow-2xl"
        />
      </div>

      {/* App name */}
      <div
        className={`mt-5 text-center transition-all duration-500 ease-out delay-100 ${
          phase === "logo"
            ? "opacity-0 translate-y-4"
            : "opacity-100 translate-y-0"
        }`}
      >
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          Meu Imposto de Renda
        </h1>
        <p className="mt-1 text-[11px] text-white/40 uppercase tracking-[0.25em]">
          Receita Federal do Brasil
        </p>
      </div>

      {/* Progress bar */}
      <div
        className={`mt-10 w-48 transition-all duration-500 ${
          phase === "progress" || phase === "done"
            ? "opacity-100"
            : "opacity-0"
        }`}
      >
        <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-[hsl(var(--gov-gold))] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-[10px] text-white/30">
          Carregando...
        </p>
      </div>

      {/* Security badge */}
      <div
        className={`absolute bottom-10 flex items-center gap-2 text-[10px] text-white/20 transition-all duration-500 ${
          phase !== "logo" ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-px w-8 bg-white/10" />
        <span>Conexão segura • SSL/TLS</span>
        <div className="h-px w-8 bg-white/10" />
      </div>
    </div>
  );
};

export default SplashScreen;
