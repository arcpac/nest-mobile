import { mobileLogin, otpMobileLogin } from '@/src/lib/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from './providers/AuthProvider';

type LoginMethod = "password" | "otp"

function LoginForm({ email, setEmail, password, setPassword, onHandleLogin }: {
  email: string;
  password: string;
  setPassword: (value: string) => void;
  setEmail: (value: string) => void;
  onHandleLogin: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nest app</Text>
      <Text style={styles.subtitle}>Split your expenses with groups</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
      />

      <Pressable style={styles.button} onPress={onHandleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>
    </View>
  )
}

function OtpForm({ email, setEmail, onHandleLoginOtp }: {
  email: string;
  password: string;
  setPassword: (value: string) => void;
  setEmail: (value: string) => void;
  onHandleLoginOtp: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nest app</Text>
      <Text style={styles.subtitle}>Split your expenses with groups</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
      />

      <Pressable style={styles.button} onPress={onHandleLoginOtp}>
        <Text style={styles.buttonText}>Conitnue</Text>
      </Pressable>
    </View>
  )
}


export default function LoginScreen() {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password')
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken } = useAuth();

  const toggleOtpForm = () => setLoginMethod((prev) => (prev === 'otp' ? 'password' : 'otp'))

  const handleLogin = async () => {
    const { token } = await mobileLogin(email, password);
    console.log('handleLogin', token)
    await setToken(token);

    router.replace("/(tabs)");
  };

  const handleLoginOtp = async () => {
    const {challengeId} = await otpMobileLogin(email);
    router.push({ pathname: "/otp", params: { email, challengeId } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {loginMethod === 'password' ?
        (<LoginForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onHandleLogin={handleLogin}
        />) : (<OtpForm
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onHandleLoginOtp={handleLoginOtp}
        />)
      }
      <Pressable style={styles.loginOtherOptions} onPress={toggleOtpForm}>
        <Text style={styles.magicLinkText}>Continue with {loginMethod !== 'otp' ? 'OTP' : 'password'}</Text>
      </Pressable>
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
