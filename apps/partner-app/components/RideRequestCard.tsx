import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import type { Ride } from '@ride-hailing/shared-types';

interface RideRequestCardProps {
  ride: Ride;
  onAccept: () => void;
  onReject: () => void;
  timeoutSeconds?: number;
}

export function RideRequestCard({
  ride,
  onAccept,
  onReject,
  timeoutSeconds = 30,
}: RideRequestCardProps) {
  const [remainingTime, setRemainingTime] = useState(timeoutSeconds);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject(); // Auto-reject on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReject]);

  // Pulse animation
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.02,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    const loop = Animated.loop(pulse);
    loop.start();

    return () => loop.stop();
  }, [pulseAnim]);

  const estimatedFare = (Math.random() * 20 + 10).toFixed(2);
  const estimatedDistance = (Math.random() * 8 + 2).toFixed(1);

  return (
    <Animated.View 
      style={{ transform: [{ scale: pulseAnim }] }}
      className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-3xl p-6 shadow-level-3 border-2 border-brand-400/50"
    >
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-white text-2xl font-bold tracking-tight">🔔 New Request!</Text>
        <View className="bg-white/30 rounded-2xl px-4 py-2 shadow-level-1">
          <Text className="text-white font-bold text-lg font-mono">{remainingTime}s</Text>
        </View>
      </View>

      {/* Locations - Enhanced */}
      <View className="bg-white/20 backdrop-blur-sm rounded-2xl p-5 mb-5 border border-white/30">
        <View className="flex-row items-center mb-4">
          <View className="w-4 h-4 rounded-full bg-green-400 mr-3 shadow-glow" />
          <View className="flex-1">
            <Text className="text-white/80 text-xs uppercase tracking-wider mb-1 font-semibold">Pickup</Text>
            <Text className="text-white font-bold text-base" numberOfLines={1}>
              {ride.pickup.formatted}
            </Text>
          </View>
        </View>
        <View className="w-0.5 h-4 bg-white/40 ml-1.5 mb-4" />
        <View className="flex-row items-center">
          <View className="w-4 h-4 rounded-full bg-red-400 mr-3" />
          <View className="flex-1">
            <Text className="text-white/80 text-xs uppercase tracking-wider mb-1 font-semibold">Dropoff</Text>
            <Text className="text-white font-bold text-base" numberOfLines={1}>
              {ride.dropoff.formatted}
            </Text>
          </View>
        </View>
      </View>

      {/* Estimates - Enhanced */}
      <View className="flex-row justify-around mb-6 bg-white/10 rounded-2xl p-4">
        <View className="items-center flex-1">
          <Text className="text-white/70 text-xs uppercase tracking-wider mb-1">Est. Fare</Text>
          <Text className="text-white text-2xl font-bold font-mono">${estimatedFare}</Text>
        </View>
        <View className="w-px bg-white/30" />
        <View className="items-center flex-1">
          <Text className="text-white/70 text-xs uppercase tracking-wider mb-1">Distance</Text>
          <Text className="text-white text-2xl font-bold font-mono">{estimatedDistance} km</Text>
        </View>
      </View>

      {/* Actions - Enhanced */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={onReject}
          className="flex-1 bg-white/20 border-2 border-white/30 rounded-2xl py-4 active:bg-white/30"
        >
          <Text className="text-white font-bold text-center text-base">❌ Reject</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          className="flex-1 bg-white rounded-2xl py-4 active:opacity-90 shadow-level-2"
        >
          <Text className="text-brand-600 font-bold text-center text-base">✅ Accept</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

