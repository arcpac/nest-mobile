import type { BottomTabHeaderProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/app/providers/AuthProvider';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabsHeader({ options, route }: BottomTabHeaderProps) {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const theme = Colors[colorScheme ?? 'light'];
    const { setToken } = useAuth();

    // const title = typeof options.title === 'string' ? options.title : route.name;

    const confirmLogout = useCallback(() => {
        Alert.alert("Log out", "Are you sure you want to log out?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Log out",
            style: "destructive",
            onPress: async () => {
              await setToken(null);          // updates memory + SecureStore
              router.replace("/login");      // then navigate
            },
          },
        ]);
      }, [router, setToken]);

    return (
        <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: theme.background }]}>
            <View style={styles.container}>
                <Text style={[styles.title, { color: theme.text }]}>Nest app</Text>
                <Pressable
                    onPress={confirmLogout}
                    style={({ pressed }) => [
                        styles.logoutButton,
                        { backgroundColor: theme.tint, opacity: pressed ? 0.85 : 1 },
                    ]}>
                    <Text style={styles.logoutText}>Logout</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#D6D6D6',
    },
    container: {
        height: 52,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    logoutButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    logoutText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
