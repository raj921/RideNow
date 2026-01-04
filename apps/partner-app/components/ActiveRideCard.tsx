import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { Ride, RideState } from '@ride-hailing/shared-types';
import { RIDE_STATE_LABELS } from '@ride-hailing/shared-types';

interface ActiveRideCardProps {
  ride: Ride;
  onArrive?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function ActiveRideCard({
  ride,
  onArrive,
  onStart,
  onComplete,
  onCancel,
}: ActiveRideCardProps) {
  const getActionButton = () => {
    switch (ride.state as RideState) {
      case 'PARTNER_ASSIGNED':
        return {
          label: 'Arrived at Pickup',
          onPress: onArrive,
          color: 'bg-blue-500',
        };
      case 'PARTNER_ARRIVED':
        return {
          label: 'Start Trip',
          onPress: onStart,
          color: 'bg-green-500',
        };
      case 'TRIP_STARTED':
        return {
          label: 'Complete Trip',
          onPress: onComplete,
          color: 'bg-emerald-500',
        };
      default:
        return null;
    }
  };

  const action = getActionButton();
  const canCancel = ['PARTNER_ASSIGNED', 'PARTNER_ARRIVED'].includes(ride.state);

  const getInstructions = () => {
    switch (ride.state as RideState) {
      case 'PARTNER_ASSIGNED':
        return 'Navigate to pickup location';
      case 'PARTNER_ARRIVED':
        return 'Waiting for customer to board';
      case 'TRIP_STARTED':
        return 'Navigate to destination';
      default:
        return '';
    }
  };

  return (
    <View className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
      {/* Status Badge */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="bg-blue-500/20 px-3 py-1.5 rounded-full">
          <Text className="text-blue-400 font-semibold text-sm">
            {RIDE_STATE_LABELS[ride.state]}
          </Text>
        </View>
        <Text className="text-zinc-500 text-xs">
          #{ride.id.slice(-6)}
        </Text>
      </View>

      {/* Instructions */}
      <View className="bg-zinc-800/50 rounded-xl p-3 mb-4">
        <Text className="text-zinc-300 text-center">
          {getInstructions()}
        </Text>
      </View>

      {/* Locations */}
      <View className="mb-4">
        <View className="flex-row items-start mb-3">
          <View className="w-8 items-center">
            <View className={`w-3 h-3 rounded-full ${
              ride.state === 'PARTNER_ASSIGNED' ? 'bg-green-500' : 'bg-zinc-600'
            }`} />
            <View className="w-0.5 h-8 bg-zinc-700 mt-1" />
          </View>
          <View className="flex-1">
            <Text className="text-zinc-500 text-xs mb-0.5">PICKUP</Text>
            <Text className="text-white" numberOfLines={2}>
              {ride.pickup.formatted}
            </Text>
          </View>
        </View>
        <View className="flex-row items-start">
          <View className="w-8 items-center">
            <View className={`w-3 h-3 rounded-full ${
              ride.state === 'TRIP_STARTED' ? 'bg-red-500' : 'bg-zinc-600'
            }`} />
          </View>
          <View className="flex-1">
            <Text className="text-zinc-500 text-xs mb-0.5">DROPOFF</Text>
            <Text className="text-white" numberOfLines={2}>
              {ride.dropoff.formatted}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      {action && (
        <Pressable
          onPress={action.onPress}
          className={`${action.color} rounded-xl py-4 mb-3 active:opacity-80`}
        >
          <Text className="text-white font-bold text-center text-lg">
            {action.label}
          </Text>
        </Pressable>
      )}

      {/* Cancel Button */}
      {canCancel && onCancel && (
        <Pressable
          onPress={onCancel}
          className="bg-red-500/10 border border-red-500/30 rounded-xl py-3 active:opacity-70"
        >
          <Text className="text-red-400 font-medium text-center">
            Cancel Ride
          </Text>
        </Pressable>
      )}
    </View>
  );
}

