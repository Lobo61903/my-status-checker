const DEVICE_KEY = "rf_device_id";

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '0';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('fp_canvas', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('fp_canvas', 4, 17);
    return canvas.toDataURL().slice(-32);
  } catch {
    return '0';
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '0';
    const glCtx = gl as WebGLRenderingContext;
    const renderer = glCtx.getParameter(glCtx.RENDERER) || '';
    const vendor = glCtx.getParameter(glCtx.VENDOR) || '';
    const ext = glCtx.getExtension('WEBGL_debug_renderer_info');
    const unmaskedRenderer = ext ? glCtx.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    const unmaskedVendor = ext ? glCtx.getParameter(ext.UNMASKED_VENDOR_WEBGL) : '';
    return `${vendor}|${renderer}|${unmaskedVendor}|${unmaskedRenderer}`;
  } catch {
    return '0';
  }
}

function generateStableFingerprint(): string {
  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.hardwareConcurrency?.toString() || "0",
    navigator.maxTouchPoints?.toString() || "0",
    navigator.platform || "",
    navigator.vendor || "",
    (navigator.languages || []).join(","),
    `${screen.availWidth}x${screen.availHeight}`,
    window.devicePixelRatio?.toString() || "1",
    getCanvasFingerprint(),
    getWebGLFingerprint(),
  ];

  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    const fp = generateStableFingerprint();
    const rand = crypto.randomUUID().slice(0, 8);
    id = `${fp}-${rand}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}
