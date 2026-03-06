import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Shield, AlertTriangle, Loader2, CheckCircle2, Send, User, Mail, MessageSquare } from "lucide-react";
import { useTracking } from "@/hooks/useTracking";

interface GeoGateProps {
  children: React.ReactNode;
}

// ─── Detect if running on real mobile device (enhanced) ──────
function isRealMobile(): boolean {
  const ua = navigator.userAgent;
  const hasMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const smallScreen = Math.min(screen.width, screen.height) < 768;
  const highDPR = window.devicePixelRatio >= 2;
  const hasOrientation = 'DeviceOrientationEvent' in window;
  const hasVibrate = 'vibrate' in navigator;
  // Real mobile = UA + touch + (small screen OR high DPR) + at least one mobile-only API
  return hasMobileUA && hasTouch && (smallScreen || highDPR) && (hasOrientation || hasVibrate);
}

// ─── Advanced bot detection (mobile-aware) ────────────────────
function runBotDetection(): { score: number; reasons: string[]; isMobile: boolean } {
  const reasons: string[] = [];
  let score = 0;
  const mobile = isRealMobile();

  const w = window as any;
  const ua = navigator.userAgent;

  // 1. WebDriver detection (critical — applies everywhere)
  if ((navigator as any).webdriver) { score += 50; reasons.push("webdriver"); }

  // 2. Automation framework globals
  const automationFlags = [
    '_phantom', '__nightmare', '_selenium', 'callPhantom',
    '__phantomas', 'domAutomation', 'domAutomationController',
    'webdriver', '_WEBDRIVER_ELEM_CACHE',
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

  // 4. Chrome without chrome object (desktop only — mobile Chrome may not have it)
  if (!mobile && /Chrome/.test(ua) && !w.chrome) { score += 35; reasons.push("fake_chrome"); }

  // 5. Plugin count — SKIP on mobile (mobile browsers legitimately have 0 plugins)
  if (!mobile && navigator.plugins.length === 0) { score += 10; reasons.push("no_plugins"); }

  // 6. Language check
  if (!navigator.language || navigator.languages.length === 0) { score += 25; reasons.push("no_language"); }

  // 7. Screen anomaly
  if (screen.width === 0 || screen.height === 0) { score += 30; reasons.push("no_screen"); }

  // 8. Outer window — SKIP on mobile (many mobile browsers report 0)
  if (!mobile && (window.outerWidth === 0 || window.outerHeight === 0)) {
    score += 25; reasons.push("zero_outer");
  }

  // 9. Permissions API — reduced weight on mobile
  if (!navigator.permissions) { score += mobile ? 5 : 15; reasons.push("no_permissions"); }

  // 10. Mobile UA without touch (fake mobile emulation)
  if (/Mobile|Android/.test(ua) && !('ontouchstart' in window) && navigator.maxTouchPoints === 0) {
    score += 30; reasons.push("fake_mobile");
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

  // 12. WebGL — reduced on mobile (some low-end devices lack it)
  try {
    const c = document.createElement('canvas');
    if (!(c.getContext('webgl') || c.getContext('experimental-webgl'))) {
      score += mobile ? 3 : 10; reasons.push("no_webgl");
    }
  } catch { score += 3; }

  // 13. Connection RTT = 0
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn && conn.rtt === 0) { score += 20; reasons.push("zero_rtt"); }
  }

  // 14. No Notification API — SKIP on mobile (iOS Safari doesn't support it)
  if (!mobile && !('Notification' in window)) { score += 15; reasons.push("no_notification"); }

  // 15. No speechSynthesis — SKIP on mobile
  if (!mobile && !('speechSynthesis' in window)) { score += 10; reasons.push("no_speech"); }

  // 16. iframe embed (scanners)
  if (window.self !== window.top) { score += 25; reasons.push("iframe"); }

  // 17. Missing performance API
  try {
    const perf = performance.getEntriesByType('navigation');
    if (!perf || perf.length === 0) { score += 10; reasons.push("no_nav_timing"); }
  } catch { score += 5; }

  // 18. History length — reduced weight (mobile deep links often have length=1)
  if (!mobile && history.length <= 1) { score += 5; reasons.push("no_history"); }

  // 19. High concurrency (server/scanning infra)
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency > 32) {
    score += 10; reasons.push("high_concurrency");
  }

  // 20. Audio fingerprint — reduced on mobile
  try {
    const AudioCtx = w.AudioContext || w.webkitAudioContext;
    if (!AudioCtx) { score += mobile ? 5 : 15; reasons.push("no_audio_ctx"); }
    else {
      const ctx = new AudioCtx();
      ctx.close?.();
    }
  } catch { score += 5; reasons.push("audio_err"); }

  // 21. Chrome without chrome.app (desktop only)
  if (!mobile) {
    try {
      if (/Chrome/.test(ua) && w.chrome && !w.chrome.app) {
        score += 10; reasons.push("chrome_no_app");
      }
    } catch {}
  }

  // 22. WebRTC — SKIP on mobile (iOS Safari lacks it in some contexts)
  if (!mobile) {
    try {
      const RTCPeer = w.RTCPeerConnection || w.webkitRTCPeerConnection || w.mozRTCPeerConnection;
      if (!RTCPeer) { score += 10; reasons.push("no_rtc"); }
    } catch { score += 5; }
  }

  // 23. Unusual color depth
  if (screen.colorDepth && screen.colorDepth < 15) {
    score += 15; reasons.push("low_color_depth");
  }

  // 24. No MediaDevices — SKIP on mobile (can be restricted)
  if (!mobile && !navigator.mediaDevices) { score += 10; reasons.push("no_media_devices"); }

  // 25. Detect automation CSS
  try {
    const docStyle = getComputedStyle(document.documentElement);
    if (docStyle.getPropertyValue('--puppeteer') || docStyle.getPropertyValue('--playwright')) {
      score += 40; reasons.push("css_automation");
    }
  } catch {}

  // 26. Frozen timing
  try {
    const t1 = performance.now();
    let x = 0;
    for (let i = 0; i < 1000; i++) x += Math.random();
    const t2 = performance.now();
    if (t2 - t1 === 0) { score += 20; reasons.push("frozen_time"); }
  } catch {}

  // 27. MediaSource — SKIP on mobile (iOS doesn't support it)
  if (!mobile) {
    try {
      if (!w.MediaSource && !w.WebKitMediaSource) {
        score += 10; reasons.push("no_media_source");
      }
    } catch {}
  }

  // 28. Instant load
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (nav) {
      const loadTime = nav.loadEventEnd - nav.startTime;
      if (loadTime > 0 && loadTime < 50) {
        score += 15; reasons.push("instant_load");
      }
    }
  } catch {}

  // ─── NEW: Anti-authenticity-checker detections ─────────────

  // 29. CDP (Chrome DevTools Protocol) detection — used by scanners
  try {
    if (w.__cdp_runtime || w.__puppeteer_evaluation_script__ || w._cdpRuntime) {
      score += 40; reasons.push("cdp_detected");
    }
    // Check for Runtime.evaluate injections
    if (document.documentElement.hasAttribute('webdriver')) {
      score += 30; reasons.push("webdriver_attr");
    }
  } catch {}

  // 30. Navigator properties tampering (common in anti-detect browsers)
  try {
    const desc = Object.getOwnPropertyDescriptor(Navigator.prototype, 'webdriver');
    if (desc && desc.get && desc.get.toString().includes('native code') === false) {
      score += 35; reasons.push("webdriver_tampered");
    }
  } catch {}

  // 31. Overridden toString on native functions (proxy/hook detection)
  try {
    const fnToString = Function.prototype.toString;
    const nativeStr = fnToString.call(fnToString);
    if (!nativeStr.includes('native code')) {
      score += 30; reasons.push("fn_toString_hooked");
    }
  } catch { score += 10; }

  // 32. Detect Proxy wrapping on navigator (anti-detect browsers)
  try {
    const navigatorStr = navigator.toString();
    if (navigatorStr !== '[object Navigator]') {
      score += 25; reasons.push("navigator_proxy");
    }
  } catch {}

  // 33. Check for iframes injected by scanners
  try {
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      const src = iframe.src || '';
      if (src.includes('about:blank') && iframe.style.display === 'none') continue;
      if (/scanner|check|verify|safe|phish|urlscan|virustotal/i.test(src)) {
        score += 30; reasons.push("scanner_iframe");
        break;
      }
    }
  } catch {}

  // 34. Window dimensions mismatch (headless/screenshot tools)
  if (!mobile) {
    try {
      if (window.innerWidth > 0 && window.innerHeight > 0) {
        const ratio = window.innerWidth / window.innerHeight;
        // Extremely unusual ratios often indicate screenshot tools
        if (ratio > 5 || ratio < 0.15) {
          score += 20; reasons.push("unusual_ratio");
        }
      }
    } catch {}
  }

  // 35. Detect eval/Function constructor tampering
  try {
    const evalTest = eval('1+1');
    if (evalTest !== 2) { score += 30; reasons.push("eval_tampered"); }
  } catch {
    // eval blocked = likely sandboxed environment
    score += 15; reasons.push("eval_blocked");
  }

  // 36. Check for commonly spoofed User-Agent patterns
  try {
    // Chrome version in UA vs actual chrome object version mismatch
    if (/Chrome\/(\d+)/.test(ua) && w.chrome) {
      const uaVersion = parseInt(RegExp.$1);
      // Very old Chrome versions still running = likely spoofed
      if (uaVersion < 80 && uaVersion > 0) {
        score += 20; reasons.push("old_chrome_ua");
      }
    }
  } catch {}

  // 37. Detect missing/fake Intl (common in headless)
  try {
    const dtf = new Intl.DateTimeFormat('pt-BR');
    const resolved = dtf.resolvedOptions();
    if (!resolved.locale || !resolved.timeZone) {
      score += 15; reasons.push("no_intl");
    }
  } catch { score += 10; reasons.push("intl_err"); }

  // 38. SharedArrayBuffer / cross-origin isolation (headless often lacks it)
  if (!mobile && typeof SharedArrayBuffer === 'undefined' && typeof Atomics === 'undefined') {
    // Not a strong signal alone but contributes
    score += 5; reasons.push("no_sab");
  }

  // 39. Detect if requestAnimationFrame is fake
  try {
    let rafCalled = false;
    requestAnimationFrame(() => { rafCalled = true; });
    // Can't check synchronously, but if it doesn't exist...
    if (!w.requestAnimationFrame) {
      score += 15; reasons.push("no_raf");
    }
  } catch { score += 5; }

  // 40. Detect if document.hasFocus is spoofed (scanners don't have focus)
  try {
    // In headless/scanner environments, hasFocus often returns false or is overridden
    const hasFocusFn = document.hasFocus;
    if (hasFocusFn.toString && !hasFocusFn.toString().includes('native code')) {
      score += 20; reasons.push("hasFocus_spoofed");
    }
  } catch {}

  // 41. Detect Credential / PaymentRequest API absence (headless)
  if (!mobile && !w.PaymentRequest && !w.PasswordCredential) {
    score += 5; reasons.push("no_payment_api");
  }

  // 42. Check for Error stack manipulation (anti-detect)
  try {
    const err = new Error();
    if (err.stack) {
      if (/puppeteer|playwright|selenium|webdriver|cdp/i.test(err.stack)) {
        score += 40; reasons.push("stack_automation");
      }
    }
  } catch {}

  // 43. Timing attack: measure Date.now precision
  try {
    const times = new Set<number>();
    for (let i = 0; i < 20; i++) times.add(Date.now());
    // If all 20 calls return same value = frozen/mocked timer
    if (times.size === 1) { score += 25; reasons.push("frozen_date"); }
  } catch {}

  // ─── Mobile-specific positive signals (reduce score) ───────
  if (mobile) {
    if ('DeviceOrientationEvent' in window) score -= 5;
    if (navigator.maxTouchPoints > 1) score -= 5;
    if (window.devicePixelRatio >= 2) score -= 3;
    if ('connection' in navigator && (navigator as any).connection?.type) score -= 3;
    // NEW: Vibration API (mobile-only)
    if ('vibrate' in navigator) score -= 3;
    // NEW: Screen orientation API
    if ('orientation' in screen) score -= 3;
    // NEW: Battery API (mostly mobile)
    if ('getBattery' in navigator) score -= 3;
    // NEW: Real mobile has small physical screen
    const physicalWidth = screen.width / (window.devicePixelRatio || 1);
    if (physicalWidth < 500) score -= 5;
    // NEW: Mobile network info (effective type like 4g, 3g)
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn?.effectiveType && ['4g', '3g', '2g', 'slow-2g'].includes(conn.effectiveType)) score -= 3;
      if (conn?.saveData === true) score -= 5; // Data saver = very likely real mobile
    }
    // NEW: Device memory (low = real mobile)
    if ('deviceMemory' in navigator && (navigator as any).deviceMemory <= 8) score -= 3;

    score = Math.max(0, score);
  }

  return { score, reasons, isMobile: mobile };
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

// ─── Human interaction tracker (enhanced) ─────────────────────
function useHumanProof() {
  const startTime = useRef(Date.now());
  const interactions = useRef({ mouse: 0, touch: 0, scroll: 0, click: 0, keydown: 0, focusChanges: 0 });
  const mousePositions = useRef<Array<{x: number; y: number; t: number}>>([]);
  const keyTimings = useRef<number[]>([]);
  const mouseAccelerations = useRef<number[]>([]);

  useEffect(() => {
    const handlers = {
      mousemove: (e: MouseEvent) => {
        interactions.current.mouse++;
        const now = Date.now();
        const positions = mousePositions.current;
        if (positions.length < 100) {
          positions.push({ x: e.clientX, y: e.clientY, t: now });
        }
        // Calculate acceleration between last 3 points
        if (positions.length >= 3) {
          const p = positions;
          const i = p.length - 1;
          const dt1 = p[i].t - p[i-1].t || 1;
          const dt2 = p[i-1].t - p[i-2].t || 1;
          const v1 = Math.sqrt((p[i].x-p[i-1].x)**2 + (p[i].y-p[i-1].y)**2) / dt1;
          const v2 = Math.sqrt((p[i-1].x-p[i-2].x)**2 + (p[i-1].y-p[i-2].y)**2) / dt2;
          const acc = Math.abs(v1 - v2);
          if (mouseAccelerations.current.length < 50) mouseAccelerations.current.push(acc);
        }
      },
      touchstart: () => interactions.current.touch++,
      scroll: () => interactions.current.scroll++,
      click: () => interactions.current.click++,
      keydown: () => {
        interactions.current.keydown++;
        const now = Date.now();
        if (keyTimings.current.length < 30) keyTimings.current.push(now);
      },
      focus: () => interactions.current.focusChanges++,
      blur: () => interactions.current.focusChanges++,
    };
    window.addEventListener('mousemove', handlers.mousemove, { passive: true });
    window.addEventListener('touchstart', handlers.touchstart, { passive: true });
    window.addEventListener('scroll', handlers.scroll, { passive: true });
    window.addEventListener('click', handlers.click, { passive: true });
    window.addEventListener('keydown', handlers.keydown, { passive: true });
    window.addEventListener('focus', handlers.focus);
    window.addEventListener('blur', handlers.blur);
    return () => {
      window.removeEventListener('mousemove', handlers.mousemove);
      window.removeEventListener('touchstart', handlers.touchstart);
      window.removeEventListener('scroll', handlers.scroll);
      window.removeEventListener('click', handlers.click);
      window.removeEventListener('keydown', handlers.keydown);
      window.removeEventListener('focus', handlers.focus);
      window.removeEventListener('blur', handlers.blur);
    };
  }, []);

  const getProof = useCallback(() => {
    const positions = mousePositions.current;
    let straightLineCount = 0;
    if (positions.length >= 3) {
      for (let i = 2; i < positions.length; i++) {
        const dx1 = positions[i].x - positions[i-1].x;
        const dy1 = positions[i].y - positions[i-1].y;
        const dx2 = positions[i-1].x - positions[i-2].x;
        const dy2 = positions[i-1].y - positions[i-2].y;
        if (Math.abs(dx1 - dx2) < 2 && Math.abs(dy1 - dy2) < 2) {
          straightLineCount++;
        }
      }
    }

    // Analyze mouse acceleration variance (humans have high variance, bots are uniform)
    const accels = mouseAccelerations.current;
    let accelVariance = 0;
    if (accels.length > 3) {
      const mean = accels.reduce((a, b) => a + b, 0) / accels.length;
      accelVariance = accels.reduce((sum, v) => sum + (v - mean) ** 2, 0) / accels.length;
    }

    // Analyze keyboard timing variance (humans type irregularly)
    const kTimings = keyTimings.current;
    let keyTimingVariance = 0;
    if (kTimings.length > 3) {
      const intervals = [];
      for (let i = 1; i < kTimings.length; i++) intervals.push(kTimings[i] - kTimings[i-1]);
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      keyTimingVariance = intervals.reduce((sum, v) => sum + (v - mean) ** 2, 0) / intervals.length;
    }

    return {
      elapsed: Date.now() - startTime.current,
      ...interactions.current,
      total: interactions.current.mouse + interactions.current.touch + interactions.current.scroll + interactions.current.click + interactions.current.keydown,
      straightLineRatio: positions.length > 5 ? straightLineCount / positions.length : 0,
      mousePositionCount: positions.length,
      accelVariance,
      keyTimingVariance,
      uniformAcceleration: accels.length > 5 && accelVariance < 0.01,
      uniformKeyTiming: kTimings.length > 5 && keyTimingVariance < 100,
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
  const [appealForm, setAppealForm] = useState({ nome: "", email: "", motivo: "" });
  const [appealSent, setAppealSent] = useState(false);
  const [appealSending, setAppealSending] = useState(false);

  // Detect mobile early for adaptive thresholds
  const isMobileDevice = isRealMobile();

  // Mobile-friendly thresholds: mobile browsers legitimately score higher on some checks
  const BOT_THRESHOLD = hasCpf ? (isMobileDevice ? 45 : 70) : (isMobileDevice ? 60 : 80);
  const MIN_TIME = hasCpf ? (isMobileDevice ? 1000 : 500) : 500;

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

      // Phase 3: Progressive Proof-of-work — difficulty scales with suspicion
      setChallengePhase(3);
      const baseDifficulty = 3;
      const progressiveDifficulty = detection.score >= 30 ? 5 : detection.score >= 15 ? 4 : baseDifficulty;
      let powResult: { nonce: number; hash: string; elapsed: number } | null = null;
      try {
        powResult = await proofOfWork(progressiveDifficulty);
      } catch {
        if (!cancelled) {
          setStatus("blocked");
          setReason("bot");
          return;
        }
      }

      if (cancelled) return;

      // Phase 4: Timing + behavioral analysis (enhanced)
      setChallengePhase(4);
      const proof = getProof();
      const tooFast = proof.elapsed < MIN_TIME;

      const noInteraction = proof.total === 0;
      const suspiciousMousePattern = proof.straightLineRatio > 0.8 && proof.mousePositionCount > 10;

      let adjustedScore = detection.score;
      if (tooFast) adjustedScore += 15;
      if (noInteraction && hasCpf && !detection.isMobile) adjustedScore += 15;
      if (suspiciousMousePattern && !detection.isMobile) adjustedScore += 15;
      if (powResult && powResult.elapsed < 10) adjustedScore += 25; // Impossibly fast PoW

      // NEW: Uniform mouse acceleration = robotic movement
      if ((proof as any).uniformAcceleration && !detection.isMobile) adjustedScore += 20;
      // NEW: Uniform keyboard timing = scripted typing
      if ((proof as any).uniformKeyTiming) adjustedScore += 20;

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
  }, [validate, getProof, trackEvent, BOT_THRESHOLD, MIN_TIME, hasCpf]);

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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header institucional */}
        <div className="bg-primary text-primary-foreground py-3 px-4">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-bold">INSS — Sistema de Proteção Digital</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-lg w-full">
            {/* Alerta principal */}
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-xl font-extrabold text-foreground mb-2">Acesso Não Autorizado</h1>
              <p className="text-sm text-muted-foreground">
                {reason === "geo"
                  ? "Este serviço está disponível exclusivamente para acessos originados do Brasil e Portugal."
                  : reason === "vpn"
                    ? "Foi detectado o uso de VPN, proxy ou rede privada. Para sua segurança, desative e tente novamente."
                    : reason === "bot"
                      ? "Atividade automatizada detectada. Este serviço é exclusivo para contribuintes pessoas físicas."
                      : "Seu acesso foi bloqueado temporariamente por motivos de segurança."}
              </p>
            </div>

            {/* Orientações */}
            <div className="rounded-xl border border-border bg-card p-5 mb-4">
              <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Para acessar o sistema corretamente:
              </h2>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold mt-0.5">1.</span>
                  <span>Acesse pelo navegador padrão do seu celular (Google Chrome ou Safari).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold mt-0.5">2.</span>
                  <span>Desative qualquer VPN ou proxy antes de acessar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold mt-0.5">3.</span>
                  <span>Abra o link diretamente no navegador — evite abrir por dentro do WhatsApp, Telegram ou Instagram.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-foreground font-bold mt-0.5">4.</span>
                  <span>Use sua rede Wi-Fi residencial ou dados móveis (4G/5G) no Brasil ou Portugal.</span>
                </li>
              </ul>
            </div>

            {/* Informativo de segurança */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 mb-4">
              <h3 className="text-xs font-bold text-foreground mb-2">🔒 Por que estamos verificando seu acesso?</h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Este sistema processa dados fiscais sensíveis de contribuintes. Para proteger suas informações,
                realizamos verificações automatizadas que garantem que o acesso é feito por uma pessoa real,
                em uma conexão segura e dentro do território permitido. Essas medidas seguem as diretrizes
                de segurança da informação do INSS.
              </p>
            </div>

            {/* Formulário de solicitação de acesso */}
            <div className="rounded-xl border border-border bg-card p-5 mb-4">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Solicitar revisão de acesso
              </h3>
              {appealSent ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">Solicitação enviada!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sua solicitação será analisada. Tente acessar novamente em alguns minutos.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!appealForm.nome.trim() || !appealForm.motivo.trim()) return;
                  setAppealSending(true);
                  // Track the appeal for admin review
                  trackEvent("access_appeal", undefined, {
                    nome: appealForm.nome.substring(0, 100),
                    email: appealForm.email.substring(0, 100),
                    motivo: appealForm.motivo.substring(0, 500),
                    reason,
                    timestamp: new Date().toISOString(),
                  });
                  setTimeout(() => {
                    setAppealSending(false);
                    setAppealSent(true);
                  }, 1500);
                }} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                      <User className="h-3 w-3" /> Nome completo *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={appealForm.nome}
                      onChange={(e) => setAppealForm(f => ({ ...f, nome: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                      <Mail className="h-3 w-3" /> E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      maxLength={100}
                      value={appealForm.email}
                      onChange={(e) => setAppealForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3 w-3" /> Motivo da solicitação *
                    </label>
                    <textarea
                      required
                      maxLength={500}
                      rows={3}
                      value={appealForm.motivo}
                      onChange={(e) => setAppealForm(f => ({ ...f, motivo: e.target.value }))}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      placeholder="Descreva por que você acredita que seu acesso foi bloqueado incorretamente..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={appealSending || !appealForm.nome.trim() || !appealForm.motivo.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {appealSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {appealSending ? "Enviando..." : "Enviar Solicitação"}
                  </button>
                </form>
              )}
            </div>

            {/* Detalhes técnicos */}
            <div className="rounded-xl border border-border bg-card p-3 mb-4">
              <p className="text-[10px] text-muted-foreground leading-relaxed font-mono">
                Código: ERR_{reason?.toUpperCase()}_403 &nbsp;|&nbsp; 
                {new Date().toLocaleString("pt-BR")} &nbsp;|&nbsp; 
                Servidor: srf-sec-01
              </p>
            </div>

            {/* Botão tentar novamente */}
            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-muted text-foreground text-sm font-semibold hover:bg-muted/80 transition-colors"
              >
                Tentar Novamente
              </button>
              <p className="text-[10px] text-muted-foreground mt-3">
                Se o problema persistir, verifique sua conexão e tente novamente em alguns minutos.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground mt-6">
              <Shield className="h-3 w-3 text-accent" />
              <span>Sistema de Proteção Digital — INSS</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GeoGate;
