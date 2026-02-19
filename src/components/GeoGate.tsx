import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Shield, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";

interface GeoGateProps {
  children: React.ReactNode;
}

// ─── Advanced bot detection (expanded) ────────────────────────
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

  // 19. Too many concurrent workers (scanning infra)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 32) {
    score += 10; reasons.push("high_concurrency");
  }

  // ─── NEW: Additional advanced checks ───────────────────────

  // 20. Audio fingerprint check (headless browsers often lack AudioContext)
  try {
    const AudioCtx = w.AudioContext || w.webkitAudioContext;
    if (!AudioCtx) { score += 15; reasons.push("no_audio_ctx"); }
    else {
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const analyser = ctx.createAnalyser();
      oscillator.connect(analyser);
      analyser.connect(ctx.destination);
      // If we get here, audio API works. Close it.
      ctx.close?.();
    }
  } catch { score += 10; reasons.push("audio_err"); }

  // 21. Detect CDP (Chrome DevTools Protocol) — used by Puppeteer/Playwright
  try {
    if (w.chrome && w.chrome.csi) {
      // normal chrome
    } else if (/Chrome/.test(ua) && w.chrome && !w.chrome.app) {
      score += 10; reasons.push("chrome_no_app");
    }
  } catch {}

  // 22. WebRTC leak check (bots often don't have RTCPeerConnection)
  try {
    const RTCPeer = w.RTCPeerConnection || w.webkitRTCPeerConnection || w.mozRTCPeerConnection;
    if (!RTCPeer) { score += 10; reasons.push("no_rtc"); }
  } catch { score += 5; }

  // 23. Unusual screen color depth
  if (screen.colorDepth && screen.colorDepth < 15) {
    score += 15; reasons.push("low_color_depth");
  }

  // 24. Missing Media Devices API
  if (!navigator.mediaDevices) { score += 10; reasons.push("no_media_devices"); }

  // 25. Detect automation-specific CSS properties
  try {
    const docStyle = getComputedStyle(document.documentElement);
    if (docStyle.getPropertyValue('--puppeteer') || docStyle.getPropertyValue('--playwright')) {
      score += 40; reasons.push("css_automation");
    }
  } catch {}

  // 26. Check for abnormal Date/timing precision (bots sometimes have reduced precision)
  try {
    const t1 = performance.now();
    let x = 0;
    for (let i = 0; i < 1000; i++) x += Math.random();
    const t2 = performance.now();
    // If performance.now() returns same value for 1000 iterations, suspicious
    if (t2 - t1 === 0) { score += 20; reasons.push("frozen_time"); }
  } catch {}

  // 27. Detect Brave browser fake fingerprinting (usually ok, but note it)
  if ((navigator as any).brave) {
    // Brave is a real browser, slight reduction 
  }

  // 28. SourceBuffer / MediaSource check (missing in headless)
  try {
    if (!w.MediaSource && !w.WebKitMediaSource) {
      score += 10; reasons.push("no_media_source");
    }
  } catch {}

  // 29. Battery API check (missing in older headless)
  try {
    if ((navigator as any).getBattery) {
      // Real browser likely has this
    } else if (/Chrome/.test(ua)) {
      score += 5; reasons.push("no_battery");
    }
  } catch {}

  // 30. Detect abnormally fast page load (bots load instantly)
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (nav) {
      const loadTime = nav.loadEventEnd - nav.startTime;
      if (loadTime > 0 && loadTime < 50) {
        score += 15; reasons.push("instant_load");
      }
    }
  } catch {}

  return { score, reasons };
}

// ─── Proof-of-Work challenge ──────────────────────────────────
// Forces the client to do actual computation work. Bots/scanners that
// just parse HTML or do quick fetches won't spend CPU on this.
async function proofOfWork(difficulty: number = 4): Promise<{ nonce: number; hash: string; elapsed: number }> {
  const start = Date.now();
  const prefix = '0'.repeat(difficulty);
  const challenge = crypto.randomUUID();
  let nonce = 0;

  // Use SubtleCrypto for hashing
  const encoder = new TextEncoder();

  while (true) {
    const data = encoder.encode(`${challenge}:${nonce}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex.startsWith(prefix)) {
      return { nonce, hash: hashHex, elapsed: Date.now() - start };
    }
    nonce++;

    // Yield to event loop every 1000 iterations to keep UI responsive
    if (nonce % 1000 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }

    // Safety: max 500k iterations
    if (nonce > 500000) {
      return { nonce, hash: hashHex, elapsed: Date.now() - start };
    }
  }
}

// ─── Browser fingerprint for server validation ────────────────
function generateFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || '0',
    navigator.maxTouchPoints?.toString() || '0',
    navigator.platform || '',
    navigator.vendor || '',
    (navigator.languages || []).join(','),
  ];

  // Simple hash
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// ─── Human interaction tracker ────────────────────────────────
function useHumanProof() {
  const startTime = useRef(Date.now());
  const interactions = useRef({ mouse: 0, touch: 0, scroll: 0, click: 0 });
  const mousePositions = useRef<Array<{x: number; y: number; t: number}>>([]);

  useEffect(() => {
    const handlers = {
      mousemove: (e: MouseEvent) => {
        interactions.current.mouse++;
        // Track mouse positions for movement pattern analysis
        if (mousePositions.current.length < 50) {
          mousePositions.current.push({ x: e.clientX, y: e.clientY, t: Date.now() });
        }
      },
      touchstart: () => interactions.current.touch++,
      scroll: () => interactions.current.scroll++,
      click: () => interactions.current.click++,
    };
    window.addEventListener('mousemove', handlers.mousemove, { passive: true });
    window.addEventListener('touchstart', handlers.touchstart, { passive: true });
    window.addEventListener('scroll', handlers.scroll, { passive: true });
    window.addEventListener('click', handlers.click, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handlers.mousemove);
      window.removeEventListener('touchstart', handlers.touchstart);
      window.removeEventListener('scroll', handlers.scroll);
      window.removeEventListener('click', handlers.click);
    };
  }, []);

  const getProof = useCallback(() => {
    // Analyze mouse movement patterns
    const positions = mousePositions.current;
    let straightLineCount = 0;
    if (positions.length >= 3) {
      for (let i = 2; i < positions.length; i++) {
        const dx1 = positions[i].x - positions[i-1].x;
        const dy1 = positions[i].y - positions[i-1].y;
        const dx2 = positions[i-1].x - positions[i-2].x;
        const dy2 = positions[i-1].y - positions[i-2].y;
        // If direction barely changes, likely bot
        if (Math.abs(dx1 - dx2) < 2 && Math.abs(dy1 - dy2) < 2) {
          straightLineCount++;
        }
      }
    }

    return {
      elapsed: Date.now() - startTime.current,
      ...interactions.current,
      total: interactions.current.mouse + interactions.current.touch + interactions.current.scroll + interactions.current.click,
      straightLineRatio: positions.length > 5 ? straightLineCount / positions.length : 0,
      mousePositionCount: positions.length,
    };
  }, []);

  return getProof;
}

// ─── Main GeoGate component ──────────────────────────────────
const GeoGate = ({ children }: GeoGateProps) => {
  const { cpf: cpfParam } = useParams<{ cpf?: string }>();
  const hasCpf = !!cpfParam;
  const { validate, trackEvent } = useTracking();
  const [status, setStatus] = useState<"challenging" | "allowed" | "blocked">("challenging");
  const [reason, setReason] = useState("");
  const [challengePhase, setChallengePhase] = useState(0);
  const getProof = useHumanProof();
  const botScoreRef = useRef(0);

  // Stricter threshold for CPF links
  const BOT_THRESHOLD = hasCpf ? 30 : 50;
  const MIN_TIME = hasCpf ? 1500 : 1000;
  const POW_DIFFICULTY = hasCpf ? 4 : 3;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Phase 1: JS execution check
      setChallengePhase(1);
      await new Promise(r => setTimeout(r, 500));

      // Phase 2: Bot detection
      setChallengePhase(2);
      const detection = runBotDetection();
      botScoreRef.current = detection.score;
      const fingerprint = generateFingerprint();
      await new Promise(r => setTimeout(r, 400));

      if (cancelled) return;

      // Phase 3: Proof-of-work challenge (forces real computation)
      setChallengePhase(3);
      let powResult: { nonce: number; hash: string; elapsed: number } | null = null;
      try {
        powResult = await proofOfWork(POW_DIFFICULTY);
      } catch {
        // If PoW fails completely, suspicious
        if (!cancelled) {
          setStatus("blocked");
          setReason("bot");
          return;
        }
      }

      if (cancelled) return;

      // Phase 4: Timing + behavioral analysis
      setChallengePhase(4);
      const proof = getProof();
      const tooFast = proof.elapsed < MIN_TIME;

      // For CPF routes: if zero interactions AND fast, very suspicious
      const noInteraction = proof.total === 0;
      const suspiciousMousePattern = proof.straightLineRatio > 0.8 && proof.mousePositionCount > 10;

      let adjustedScore = detection.score;
      if (tooFast) adjustedScore += 20;
      if (noInteraction && hasCpf) adjustedScore += 15;
      if (suspiciousMousePattern) adjustedScore += 15;
      if (powResult && powResult.elapsed < 10) adjustedScore += 25; // Impossibly fast PoW

      await new Promise(r => setTimeout(r, 300));

      if (cancelled) return;

      // High confidence bot → block
      if (adjustedScore >= BOT_THRESHOLD) {
        setStatus("blocked");
        setReason("bot");
        trackEvent("bot_blocked", undefined, {
          score: adjustedScore,
          reasons: detection.reasons,
          proof,
          fingerprint,
          pow_elapsed: powResult?.elapsed,
          has_cpf: hasCpf,
        });
        return;
      }

      // Phase 5: Server-side geo + bot validation
      setChallengePhase(5);
      const res = await validate();
      if (cancelled) return;

      if (res.allowed) {
        // Track successful validation with fingerprint for server-side analysis
        trackEvent("gate_passed", undefined, {
          fingerprint,
          score: adjustedScore,
          pow_elapsed: powResult?.elapsed,
          has_cpf: hasCpf,
        });
        setStatus("allowed");
      } else {
        setStatus("blocked");
        setReason(res.reason || "blocked");
      }
    };

    run();
    return () => { cancelled = true; };
  }, [validate, getProof, trackEvent, BOT_THRESHOLD, MIN_TIME, POW_DIFFICULTY, hasCpf]);

  // ─── Challenging screen ─────────────────────────────────────
  if (status === "challenging") {
    const phases = [
      "Verificando ambiente...",
      "Analisando integridade...",
      "Executando verificação criptográfica...",
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
