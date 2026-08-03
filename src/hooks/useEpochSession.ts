import { useCallback, useState } from "react";
import { useEpochSdk } from "../lib/epoch-sdk";

// sessionStorage, not localStorage: a bearer session should die with the tab.
const KEY = "epoch.session.v1";

export function useEpochSession() {
  const sdk = useEpochSdk();
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  });
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signIn = useCallback(async () => {
    if (!sdk) throw new Error("SDK not ready");
    setIsSigningIn(true);
    try {
      const id = await sdk.createRecoverySession();
      try {
        sessionStorage.setItem(KEY, id);
      } catch {
        /* private mode */
      }
      setSessionId(id);
      return id;
    } finally {
      setIsSigningIn(false);
    }
  }, [sdk]);

  const signOut = useCallback(async () => {
    // Revoke server-side first: clearing only local state would leave a valid
    // bearer session alive for its full 7-day life.
    if (sdk && sessionId) {
      try {
        await sdk.endRecoverySession(sessionId);
      } catch {
        /* offline or already gone — still clear locally */
      }
    }
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* private mode */
    }
    setSessionId(null);
  }, [sdk, sessionId]);

  return { sessionId, signIn, signOut, isSigningIn };
}
