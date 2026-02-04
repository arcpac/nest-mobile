import { useColorScheme } from "@/hooks/use-color-scheme";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { AppApolloProvider } from "./providers/ApolloProvider";
import { AuthProvider, useAuth } from "./providers/AuthProvider";

export const unstable_settings = {
  anchor: "login",
};

function GuardedStack() {
  const router = useRouter();
  const segments = useSegments();
  const auth = useAuth();

  const inTabs = segments[0] === "(tabs)";
  const inLogin = segments[0] === "login";

  useEffect(() => {
    if (auth.status === "loading") return;

    if (auth.status === "guest" && !inLogin) {
      router.replace("/login");
      return;
    }

    if (auth.status === "authed" && inLogin) {
      router.replace("/(tabs)");
      return;
    }
  }, [auth.status, inTabs, inLogin, router]);

  if (auth.status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: "Home" }} />
      <Stack.Screen name="group-expenses/[groupId]" options={{
        title: "Group Expenses",
      }} />
      <Stack.Screen name="add-expense" options={{ presentation: 'modal', title: 'Add expense' }} />

    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AppApolloProvider>
          <GuardedStack />
        </AppApolloProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
