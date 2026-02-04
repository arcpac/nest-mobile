import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const TOKEN_KEY = "token";

type AuthContextValue = {
  status: "loading" | "authed" | "guest";
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const [token, setTokenState] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    setTokenState(t);
    setStatus(t ? "authed" : "guest");
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setToken = useCallback(async (t: string | null) => {
    if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);

    setTokenState(t);
    setStatus(t ? "authed" : "guest");
  }, []);

  const value = useMemo(
    () => ({ status, token, setToken, refresh }),
    [status, token, setToken, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
