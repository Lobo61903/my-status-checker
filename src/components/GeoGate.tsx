import { useEffect, useState, useRef, useCallback } from "react";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";

interface GeoGateProps {
  children: React.ReactNode;
}

// Advanced bot detection challenges
function runBotDetection(): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // 1. WebDriver detection
  if ((navigator as any).webdriver) {
    score += 40;
    reasons.push("webdriver");
  }

  // 2. Automation flags
  const w = window as any;
  const automationFlags = [
    '_phantom', '__nightmare', '_selenium', 'callPhantom',
    '__phantomas', 'Buffer', 'emit', 'spawn',
    'domAutomation', 'domAutomationController',
    'webdriver', '_Selenium_IDE_Recorder',
    '_WEBDRIVER_ELEM_CACHE', 'ChromeDriverw',
    '__webdriver_evaluate', '__driver_evaluate',
    '__webdriver_unwrap', '__driver_unwrap',
    '__fxdriver_evaluate', '__fxdriver_unwrap',
  ];
  for (const flag of automationFlags) {
    if (w[flag] || document.documentElement.getAttribute(flag)) {
      score += 20;
      reasons.push(`automation:${flag}`);
    }
  }

  // 3. Plugin count (bots typically have 0)
  if (navigator.plugins.length === 0) {
    score += 15;
    reasons.push("no_plugins");
  }

  // 4. Language check
  if (!navigator.language || navigator.languages.length === 0) {
    score += 20;
    reasons.push("no_language");
  }

  // 5. Screen size anomaly
  if (screen.width === 0 || screen.height === 0) {
    score += 25;
    reasons.push("no_screen");
  }

  // 6. Chrome without chrome object
  const ua = navigator.userAgent;
  if (/Chrome/.test(ua) && !(w.chrome)) {
    score += 15;
    reasons.push("fake_chrome");
  }

  // 7. Permissions API missing
  if (!navigator.permissions) {
    score += 10;
    reasons.push("no_permissions_api");
  }

  // 8. Touch support inconsistency on mobile UA
  if (/Mobile|Android/.test(ua) && !('ontouchstart' in window) && navigator.maxTouchPoints === 0) {
    score += 15;
    reasons.push("fake_mobile");
  }

  // 9. Canvas fingerprint test (bots often block canvas)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      score += 20;
      reasons.push("no_canvas");
    } else {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('test', 2, 15);
      const data = canvas.toDataURL();
      if (data === 'data:,') {
        score += 20;
        reasons.push("canvas_blocked");
      }
    }
  } catch {
    score += 10;
    reasons.push("canvas_error");
  }

  // 10. WebGL check
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      score += 10;
      reasons.push("no_webgl");
    }
  } catch {
    score += 5;
    reasons.push("webgl_error");
  }

  // 11. Connection API
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn && conn.rtt === 0) {
      score += 15;
      reasons.push("zero_rtt");
    }
  }

  // 12. History length (bots often have 1)
  if (history.length <= 1) {
    score += 5;
    reasons.push("no_history");
  }

  return { score, reasons };
}

// Honeypot + timing challenge
function useHoneypot() {
  const startTime = useRef(Date.now());
  const mouseMovements = useRef(0);
  const keyPresses = useRef(0);

  useEffect(() => {
    const onMouse = () => { mouseMovements.current++; };
    const onKey = () => { keyPresses.current++; };
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const getMetrics = useCallback(() => ({
    timeOnPage: Date.now() - startTime.current,
    mouseMovements: mouseMovements.current,
    keyPresses: keyPresses.current,
  }), []);

  return getMetrics;
}

const GeoGate = ({ children }: GeoGateProps) => {
  const { validate, trackEvent } = useTracking();
  const [status, setStatus] = useState<"challenging" | "allowed" | "blocked">("challenging");
  const [reason, setReason] = useState("");
  const [challengePhase, setChallengePhase] = useState(0);
  const getMetrics = useHoneypot();

  useEffect(() => {
    let cancelled = false;

    const runChallenge = async () => {
      // Phase 1: JS execution check
      setChallengePhase(1);
      await new Promise(r => setTimeout(r, 500));

      // Phase 2: Bot detection
      setChallengePhase(2);
      const detection = runBotDetection();
      await new Promise(r => setTimeout(r, 300));

      // Phase 3: Timing check (too fast = bot)
      setChallengePhase(3);
      const metrics = getMetrics();
      const tooFast = metrics.timeOnPage < 800; // less than 800ms = suspicious

      if (detection.score >= 40 || tooFast) {
        if (!cancelled) {
          setStatus("blocked");
          setReason("bot");
          trackEvent("bot_blocked", undefined, { score: detection.score, reasons: detection.reasons });
        }
        return;
      }

      // Phase 4: Server-side geo validation
      setChallengePhase(4);
      const res = await validate();

      if (cancelled) return;

      if (res.allowed) {
        setStatus("allowed");
      } else {
        setStatus("blocked");
        setReason(res.reason || "blocked");
      }
    };

    runChallenge();
    return () => { cancelled = true; };
  }, [validate, getMetrics, trackEvent]);

  if (status === "challenging") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-2">Verificação de Segurança</h2>
          <div className="space-y-2 mb-4">
            {[
              "Verificando ambiente...",
              "Analisando integridade...",
              "Validando navegador...",
              "Consultando servidor...",
            ].map((text, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                i < challengePhase ? "text-accent" : i === challengePhase ? "text-foreground" : "text-muted-foreground/30"
              }`}>
                {i < challengePhase ? (
                  <div className="h-3.5 w-3.5 rounded-full bg-accent/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </div>
                ) : i === challengePhase ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full bg-muted" />
                )}
                {text}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Receita Federal — Sistema de Proteção Automatizada
          </p>
        </div>
      </div>
    );
  }

  if (status === "blocked") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {reason === "geo"
              ? "Este serviço está disponível apenas para acessos originados do Brasil e Portugal."
              : reason === "bot"
                ? "Atividade automatizada detectada. Este serviço é exclusivo para contribuintes pessoas físicas."
                : "Seu acesso foi bloqueado por motivos de segurança."}
          </p>
          <div className="rounded-xl border border-border bg-card p-4 text-left mb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Código:</strong> ERR_{reason?.toUpperCase()}_403<br />
              <strong className="text-foreground">Timestamp:</strong> {new Date().toISOString()}<br />
              <strong className="text-foreground">Servidor:</strong> srf-sec-01.receita.fazenda.gov.br
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <Shield className="h-3 w-3 text-accent" />
            <span>Receita Federal do Brasil — Sistema de Segurança v3.8.2</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GeoGate;
