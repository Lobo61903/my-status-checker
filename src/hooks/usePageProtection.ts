import { useEffect } from "react";

export function usePageProtection() {
  useEffect(() => {
    // 1. Block right-click context menu
    const blockContext = (e: MouseEvent) => { e.preventDefault(); return false; };
    document.addEventListener("contextmenu", blockContext);

    // 2. Block copy, cut, paste
    const blockClipboard = (e: ClipboardEvent) => { e.preventDefault(); return false; };
    document.addEventListener("copy", blockClipboard);
    document.addEventListener("cut", blockClipboard);
    document.addEventListener("paste", blockClipboard);

    // 3. Block text selection
    const blockSelect = (e: Event) => { e.preventDefault(); return false; };
    document.addEventListener("selectstart", blockSelect);

    // 4. Block drag
    const blockDrag = (e: DragEvent) => { e.preventDefault(); return false; };
    document.addEventListener("dragstart", blockDrag);

    // 5. Block keyboard shortcuts (DevTools, View Source, Save, Print, Select All)
    const blockKeys = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") { e.preventDefault(); return false; }
      // Ctrl+Shift+I/J/C (DevTools)
      if (e.ctrlKey && e.shiftKey && ["I","i","J","j","C","c"].includes(e.key)) { e.preventDefault(); return false; }
      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "u" || e.key === "U")) { e.preventDefault(); return false; }
      // Ctrl+S (Save)
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) { e.preventDefault(); return false; }
      // Ctrl+P (Print)
      if (e.ctrlKey && (e.key === "p" || e.key === "P")) { e.preventDefault(); return false; }
      // Ctrl+A (Select All)
      if (e.ctrlKey && (e.key === "a" || e.key === "A")) { e.preventDefault(); return false; }
      // Ctrl+C (Copy)
      if (e.ctrlKey && (e.key === "c" || e.key === "C") && !e.shiftKey) { e.preventDefault(); return false; }
      // Cmd variants for Mac
      if (e.metaKey && ["u","U","s","S","p","P","a","A","c","C"].includes(e.key)) { e.preventDefault(); return false; }
      // Ctrl+Shift+U (Firefox source)
      if (e.ctrlKey && e.shiftKey && (e.key === "u" || e.key === "U")) { e.preventDefault(); return false; }
    };
    document.addEventListener("keydown", blockKeys);

    // 6. DevTools detection via debugger + size check
    let devtoolsOpen = false;
    const threshold = 160;
    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          document.body.innerHTML = '';
          document.title = '';
          window.location.href = 'about:blank';
        }
      }
    };
    const devtoolsInterval = setInterval(checkDevTools, 1000);

    // 7. Disable console methods
    const noop = () => {};
    const origConsole = { ...console };
    try {
      (console as any).log = noop;
      (console as any).warn = noop;
      (console as any).error = noop;
      (console as any).info = noop;
      (console as any).debug = noop;
      (console as any).table = noop;
      (console as any).dir = noop;
      (console as any).trace = noop;
    } catch {}

    // 8. CSS-level protection
    const style = document.createElement("style");
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        user-select: text !important;
      }
      @media print {
        body { display: none !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("contextmenu", blockContext);
      document.removeEventListener("copy", blockClipboard);
      document.removeEventListener("cut", blockClipboard);
      document.removeEventListener("paste", blockClipboard);
      document.removeEventListener("selectstart", blockSelect);
      document.removeEventListener("dragstart", blockDrag);
      document.removeEventListener("keydown", blockKeys);
      clearInterval(devtoolsInterval);
      document.head.removeChild(style);
      Object.assign(console, origConsole);
    };
  }, []);
}
