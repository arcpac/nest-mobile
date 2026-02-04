import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";

type AuthState =
  | { status: "loading"; token: null }
  | { status: "authed"; token: string }
  | { status: "guest"; token: null };

const TOKEN_KEY = "token";

export function useAuthToken() {
  const [state, setState] = useState<AuthState>({ status: "loading", token: null });

  const refresh = useCallback(async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) setState({ status: "authed", token });
    else setState({ status: "guest", token: null });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...state, refresh };
}
