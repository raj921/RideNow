import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#09090b' },
          animation: 'fade',
        }}
      />
    </View>
  );
}
