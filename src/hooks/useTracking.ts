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

function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function useTracking() {
  const sessionId = useRef(getSessionId());

  const validate = useCallback(async (): Promise<{ allowed: boolean; reason?: string }> => {
    try {
      const res = await supabase.functions.invoke("track", {
        body: {
          action: "validate",
          session_id: sessionId.current,
          user_agent: navigator.userAgent,
          referrer: document.referrer,
          is_mobile: isMobile(),
        },
      });

      if (res.error) {
        // On error, allow access (don't block real users)
        return { allowed: true };
      }

      return res.data as { allowed: boolean; reason?: string };
    } catch {
      return { allowed: true };
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
