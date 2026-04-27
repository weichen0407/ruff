import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, PlatformColor } from 'react-native';
import { getDatabase } from '../db/database';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    getDatabase()
      .then(() => {
        setDbReady(true);
      })
      .catch((err) => {
        console.error('Database init failed:', err);
        setDbError(err?.message ?? String(err));
        setDbReady(true); // continue anyway so app is not stuck
      });
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: PlatformColor('systemBackground'), justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (dbError) {
    console.warn('Database unavailable:', dbError);
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
