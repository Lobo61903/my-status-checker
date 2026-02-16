import { useEffect, useState, useRef, useCallback } from "react";
import { Shield, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";

interface GeoGateProps {
  children: React.ReactNode;
}

// ─── Advanced bot detection ───────────────────────────────────
function runBotDetection(): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  const w = window as any;
  const ua = navigator.userAgent;

  // 1. WebDriver detection
  if ((navigator as any).webdriver) { score += 50; reasons.push("webdriver"); }

  // 2. Automation framework globals
  const automationFlags = [
    '_phantom', '__nightmare', '_selenium', 'callPhantom',
    '__phantomas', 'domAutomation', 'domAutomationController',
    'webdriver', '_Selenium_IDE_Recorder', '_WEBDRIVER_ELEM_CACHE',
    'ChromeDriverw', '__webdriver_evaluate', '__driver_evaluate',
    '__webdriver_unwrap', '__driver_unwrap', '__fxdriver_evaluate',
    '__fxdriver_unwrap', '__cdp_runtime', '__puppeteer_evaluation_script__',
    'cdc_adoQpoasnfa76pfcZLmcfl_Array', 'cdc_adoQpoasnfa76pfcZLmcfl_Promise',
  ];
  for (const flag of automationFlags) {
    if (w[flag] || document.documentElement.getAttribute(flag)) {
      score += 25; reasons.push(`auto:${flag}`); break;
    }
  }

  // 3. Headless UA
  if (/HeadlessChrome|Headless|PhantomJS/i.test(ua)) { score += 50; reasons.push("headless_ua"); }

  // 4. Chrome without chrome object
  if (/Chrome/.test(ua) && !w.chrome) { score += 35; reasons.push("fake_chrome"); }

  // 5. Plugin count (bots = 0)
  if (navigator.plugins.length === 0) { score += 15; reasons.push("no_plugins"); }

  // 6. Language check
  if (!navigator.language || navigator.languages.length === 0) { score += 25; reasons.push("no_language"); }

  // 7. Screen anomaly
  if (screen.width === 0 || screen.height === 0) { score += 30; reasons.push("no_screen"); }

  // 8. Outer window dimensions (headless = 0)
  if (window.outerWidth === 0 || window.outerHeight === 0) { score += 30; reasons.push("zero_outer"); }

  // 9. Permissions API
  if (!navigator.permissions) { score += 15; reasons.push("no_permissions"); }

  // 10. Mobile UA without touch
  if (/Mobile|Android/.test(ua) && !('ontouchstart' in window) && navigator.maxTouchPoints === 0) {
    score += 15; reasons.push("fake_mobile");
  }

  // 11. Canvas fingerprint
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (!ctx) { score += 25; reasons.push("no_canvas"); }
    else {
      ctx.textBaseline = 'top'; ctx.font = '14px Arial';
      ctx.fillStyle = '#f60'; ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069'; ctx.fillText('bot_test', 2, 15);
      if (c.toDataURL() === 'data:,') { score += 25; reasons.push("canvas_blocked"); }
    }
  } catch { score += 10; reasons.push("canvas_err"); }

  // 12. WebGL
  try {
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl') || c.getContext('experimental-webgl'))) {
      score += 10; reasons.push("no_webgl");
    }
  } catch { score += 5; }

  // 13. Connection RTT = 0
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn && conn.rtt === 0) { score += 20; reasons.push("zero_rtt"); }
  }

  // 14. No Notification API (headless)
  if (!('Notification' in window)) { score += 15; reasons.push("no_notification"); }

  // 15. No speechSynthesis (headless)
  if (!('speechSynthesis' in window)) { score += 10; reasons.push("no_speech"); }

  // 16. iframe embed (scanners)
  if (window.self !== window.top) { score += 25; reasons.push("iframe"); }

  // 17. Missing/broken performance API timing
  try {
    const perf = performance.getEntriesByType('navigation');
    if (!perf || perf.length === 0) { score += 10; reasons.push("no_nav_timing"); }
  } catch { score += 5; }

  // 18. Suspicious history length
  if (history.length <= 1) { score += 5; reasons.push("no_history"); }

  // 19. DevTools protocol indicators
  if (w.__coverage__ || w.__VUE_DEVTOOLS_GLOBAL_HOOK__?.constructor?.name === 'Object') {
    // ignore common dev tools
  }

  // 20. Too many concurrent workers (scanning infra)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 32) {
    score += 10; reasons.push("high_concurrency");
  }

  return { score, reasons };
}

// ─── Human interaction tracker ────────────────────────────────
function useHumanProof() {
  const startTime = useRef(Date.now());
  const interactions = useRef({ mouse: 0, touch: 0, scroll: 0, click: 0 });

  useEffect(() => {
    const handlers = {
      mousemove: () => interactions.current.mouse++,
      touchstart: () => interactions.current.touch++,
      scroll: () => interactions.current.scroll++,
      click: () => interactions.current.click++,
    };
    Object.entries(handlers).forEach(([e, h]) => window.addEventListener(e, h, { passive: true }));
    return () => {
      Object.entries(handlers).forEach(([e, h]) => window.removeEventListener(e, h));
    };
  }, []);

  const getProof = useCallback(() => ({
    elapsed: Date.now() - startTime.current,
    ...interactions.current,
    total: interactions.current.mouse + interactions.current.touch + interactions.current.scroll + interactions.current.click,
  }), []);

  return getProof;
}

// ─── Main GeoGate component ──────────────────────────────────
const GeoGate = ({ children }: GeoGateProps) => {
  const { validate, trackEvent } = useTracking();
  const [status, setStatus] = useState<"challenging" | "allowed" | "blocked">("challenging");
  const [reason, setReason] = useState("");
  const [challengePhase, setChallengePhase] = useState(0);
  const getProof = useHumanProof();
  const botScoreRef = useRef(0);

  // Phase 1-3: Automated checks
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Phase 1: JS execution
      setChallengePhase(1);
      await new Promise(r => setTimeout(r, 600));

      // Phase 2: Bot detection
      setChallengePhase(2);
      const detection = runBotDetection();
      botScoreRef.current = detection.score;
      await new Promise(r => setTimeout(r, 400));

      // Phase 3: Timing check
      setChallengePhase(3);
      const proof = getProof();
      const tooFast = proof.elapsed < 1000;
      await new Promise(r => setTimeout(r, 300));

      if (cancelled) return;

      // High confidence bot → block
      if (detection.score >= 50 || tooFast) {
        setStatus("blocked");
        setReason("bot");
        trackEvent("bot_blocked", undefined, { score: detection.score, reasons: detection.reasons, proof });
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

    run();
    return () => { cancelled = true; };
  }, [validate, getProof, trackEvent]);

  // Removed waiting_human phase

  // ─── Challenging screen ─────────────────────────────────────
  if (status === "challenging") {
    const phases = [
      "Verificando ambiente...",
      "Analisando integridade...",
      "Validando navegador...",
      "Consultando servidor...",
    ];

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-base font-bold text-foreground mb-2">Verificação de Segurança</h2>

          <div className="space-y-2 mb-4">
            {phases.map((text, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300 ${
                i < challengePhase ? "text-accent" : i === challengePhase ? "text-foreground" : "text-muted-foreground/30"
              }`}>
                {i < challengePhase ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                ) : i === challengePhase ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <div className="h-3.5 w-3.5 rounded-full bg-muted" />
                )}
                {text}
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground mt-3">
            Receita Federal — Sistema de Proteção Automatizada
          </p>
        </div>
      </div>
    );
  }

  // ─── Blocked screen ─────────────────────────────────────────
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
              : reason === "vpn"
                ? "Detectamos que você está usando VPN ou proxy. Desative e tente novamente."
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
