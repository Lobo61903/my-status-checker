import { useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "rf_session_id";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getMobileDetails(): Record<string, unknown> {
  const ua = navigator.userAgent;
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const conn = (navigator as any).connection;
  return {
    is_mobile: mobile,
    screen: `${screen.width}x${screen.height}`,
    dpr: window.devicePixelRatio || 1,
    touch_points: navigator.maxTouchPoints || 0,
    platform: navigator.platform || '',
    languages: (navigator.languages || []).join(','),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    has_touch: 'ontouchstart' in window,
    has_orientation: 'DeviceOrientationEvent' in window,
    has_vibrate: 'vibrate' in navigator,
    connection_type: conn?.effectiveType || '',
    connection_downlink: conn?.downlink || 0,
    save_data: conn?.saveData || false,
    device_memory: (navigator as any).deviceMemory || 0,
    hardware_concurrency: navigator.hardwareConcurrency || 0,
    color_depth: screen.colorDepth || 0,
  };
}

export function useTracking() {
  const sessionId = useRef(getSessionId());

  const validate = useCallback(async (): Promise<{ allowed: boolean; reason?: string }> => {
    try {
      const deviceInfo = getMobileDetails();
      const res = await supabase.functions.invoke("track", {
        body: {
          action: "validate",
          session_id: sessionId.current,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          ...deviceInfo,
        },
      });

      if (res.error) {
        // On error, BLOCK access (fail-closed to prevent bypass)
        return { allowed: false, reason: 'error' };
      }

      return res.data as { allowed: boolean; reason?: string };
    } catch {
      return { allowed: false, reason: 'error' };
    }
  }, []);

  const trackEvent = useCallback(async (event_type: string, cpf?: string, metadata?: Record<string, unknown>) => {
    try {
      await supabase.functions.invoke("track", {
        body: {
          action: "event",
          session_id: sessionId.current,
          event_type,
          cpf,
          metadata,
        },
      });
    } catch {
      // Silently fail — tracking should never break the app
    }
  }, []);

  return { validate, trackEvent, sessionId: sessionId.current };
}
