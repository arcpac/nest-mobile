import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Pick the right base URL for your dev environment
const API_BASE =
    Platform.OS === "android"
        ? "http://10.0.2.2:3000"   // Android emulator -> host machine
        : "http://localhost:3000"; // iOS simulator

const TOKEN_KEY = "token";

export async function mobileLogin(email: string, password: string) {
    const res = await fetch(`${API_BASE}/api/mobile/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "password", email, password }),
    });
  
    const json = await res.json();
  
    if (!res.ok || !json.ok) throw new Error(json.error ?? "Login failed");
  
    return {
      token: json.token as string,
      user: json.user as { id: string; email: string; name?: string },
    };
  }

export async function otpMobileLogin(email: string) {
    const res = await fetch(`${API_BASE}/api/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  
    const data = await res.json();
    console.log('otpMobilelogin data:', data)
  
    if (!data?.challengeId) throw new Error("Failed to start OTP. Please try again.");
  
    return { challengeId: String(data.challengeId) };
  }

export async function verifyOtpMobileLogin(email: string, code: string, challengeId: string) {
    console.log('verifyOtpMobileLogin (email, code, challengeId): ',email, code, challengeId)
    if (!email?.trim()) throw new Error("Email is required");
    if (!code?.trim()) throw new Error("OTP code is required");
    if (!challengeId?.trim()) throw new Error("ChallengeId is required");

    const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code: code.trim(),
            challengeId
        }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json.ok) {
        throw new Error(json.error ?? "Invalid code");
    }

    await SecureStore.setItemAsync(TOKEN_KEY, json.token);

    return json.user as { id: string; email: string; name?: string };
}


export async function getToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function logout(setToken: (t: string | null) => Promise<void>) {
    await setToken(null); // deletes SecureStore + updates in-memory state (if implemented that way)
  }
  


