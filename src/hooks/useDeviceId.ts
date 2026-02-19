const DEVICE_KEY = "rf_device_id";

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
  ];

  let hash = 0;
  const str = components.join("|");
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // Combine fingerprint with a random part stored persistently
  return Math.abs(hash).toString(36);
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    // Combine fingerprint + random UUID for uniqueness
    const fp = generateStableFingerprint();
    const rand = crypto.randomUUID().slice(0, 8);
    id = `${fp}-${rand}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}
