import { verifyOtpMobileLogin } from "@/src/lib/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";


export default function Otp() {
    const router = useRouter();
    const params = useLocalSearchParams<{ email: string; challengeId: string }>();

    const [otpInput, setOtpInput] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const email = useMemo(() => {
        const raw = params?.email;
        return typeof raw === "string" ? raw : "";
    }, [params]);

    const challengeId = useMemo(() => {
        const raw = params?.challengeId;
        return typeof raw === "string" ? raw : "";
    }, [params]);

    const onChangeOtp = (val: string) => {
        // optional: keep digits only
        const cleaned = val.replace(/[^\d]/g, "");
        setOtpInput(cleaned);
    };

    const handleVerifyOtp = async () => {
        try {
            if (!email?.trim()) throw new Error("Missing email. Go back and try again.");
            if (!otpInput.trim()) throw new Error("Please enter the OTP code.");

            setLoading(true);

            await verifyOtpMobileLogin(email, otpInput, challengeId);

            router.replace("/(tabs)");
        } catch (e: any) {
            Alert.alert("Verify OTP", e?.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.card}>
                <Text style={styles.title}>Nest app</Text>
                <Text style={styles.subtitle}>Split your expenses with groups</Text>

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={[styles.input, { opacity: 0.8 }]}
                    value={email}
                    editable={false}
                />

                <Text style={styles.label}>OTP Code</Text>
                <TextInput
                    style={styles.input}
                    value={otpInput}
                    onChangeText={onChangeOtp}
                    placeholder="Enter 6-digit code"
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={6}
                />

                <Pressable
                    style={[styles.button, loading && { opacity: 0.6 }]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Verifying..." : "Continue"}
                    </Text>
                </Pressable>

                <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
                    <Text style={{ textAlign: "center" }}>Back</Text>
                </Pressable>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#161E54',
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E1E1E',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 6,
        marginBottom: 20,
        fontSize: 14,
        color: '#555',
    },
    label: {
        fontSize: 12,
        color: '#666',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E4E1DC',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#FAF9F7',
    },
    button: {
        marginTop: 4,
        backgroundColor: '#F16D34',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loginOtherOptions: {
        paddingHorizontal: 3,
        paddingVertical: 10,
    },
    magicLinkText: {
        textAlign: 'center',
        color: '#FFFFFF'
    }
});
