import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import type { RideState, Partner, Location } from '@ride-hailing/shared-types';
import { RIDE_STATE_LABELS } from '@ride-hailing/shared-types';

interface RideStateCardProps {
  state: RideState;
  partner?: Partner | null;
  partnerLocation?: Location | null;
  onCancel?: () => void;
  pickup?: string;
  dropoff?: string;
}

export function RideStateCard({
  state,
  partner,
  partnerLocation,
  onCancel,
  pickup,
  dropoff,
}: RideStateCardProps) {
  const canCancel = ['REQUESTED', 'SEARCHING', 'PARTNER_ASSIGNED', 'PARTNER_ARRIVED'].includes(state);
  
  const getStateColor = () => {
    switch (state) {
      case 'REQUESTED':
      case 'SEARCHING':
        return 'bg-amber-500';
      case 'PARTNER_ASSIGNED':
      case 'PARTNER_ARRIVED':
        return 'bg-blue-500';
      case 'TRIP_STARTED':
        return 'bg-green-500';
      case 'TRIP_COMPLETED':
        return 'bg-emerald-600';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'REQUESTED':
        return '📝';
      case 'SEARCHING':
        return '🔍';
      case 'PARTNER_ASSIGNED':
        return '🚗';
      case 'PARTNER_ARRIVED':
        return '📍';
      case 'TRIP_STARTED':
        return '🚀';
      case 'TRIP_COMPLETED':
        return '✅';
      case 'CANCELLED':
        return '❌';
      default:
        return '🚗';
    }
  };

  return (
    <View className="bg-neutral-900/90 rounded-3xl p-6 border border-neutral-800/50 shadow-level-2">
      {/* State Badge - Enhanced */}
      <View className="flex-row items-center mb-5">
        <View className={`${getStateColor()} px-4 py-2.5 rounded-2xl flex-row items-center shadow-level-1`}>
          <Text className="text-2xl mr-2">{getStateIcon()}</Text>
          <Text className="text-white font-bold text-base tracking-wide">
            {RIDE_STATE_LABELS[state]}
          </Text>
        </View>
        {(state === 'SEARCHING' || state === 'REQUESTED') && (
          <ActivityIndicator size="small" color="#0BDA51" className="ml-3" />
        )}
      </View>

      {/* Locations - Enhanced */}
      <View className="mb-5 bg-neutral-800/50 rounded-2xl p-4">
        <View className="flex-row items-center mb-3">
          <View className="w-4 h-4 rounded-full bg-brand-500 mr-3 shadow-glow" />
          <View className="flex-1">
            <Text className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">Pickup</Text>
            <Text className="text-white text-sm font-medium" numberOfLines={1}>
              {pickup || 'Pickup location'}
            </Text>
          </View>
        </View>
        <View className="w-0.5 h-6 bg-neutral-700 ml-1.5 mb-3" />
        <View className="flex-row items-center">
          <View className="w-4 h-4 rounded-full bg-red-500 mr-3" />
          <View className="flex-1">
            <Text className="text-neutral-500 text-xs uppercase tracking-wide mb-0.5">Dropoff</Text>
            <Text className="text-white text-sm font-medium" numberOfLines={1}>
              {dropoff || 'Dropoff location'}
            </Text>
          </View>
        </View>
      </View>

      {/* Partner Details - Enhanced */}
      {partner && state !== 'CANCELLED' && state !== 'TRIP_COMPLETED' && (
        <View className="bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 rounded-3xl p-5 mb-4 border border-neutral-700/50">
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 items-center justify-center mr-4 border border-brand-500/30">
              <Text className="text-3xl">👨‍✈️</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">{partner.name}</Text>
              <Text className="text-neutral-400 text-sm mt-0.5">
                {partner.vehicleModel} • {partner.vehicleColor}
              </Text>
              <Text className="text-neutral-500 text-xs mt-1 font-mono">{partner.vehicleNumber}</Text>
            </View>
            <View className="items-end">
              <View className="flex-row items-center bg-yellow-500/10 px-2 py-1 rounded-lg mb-1">
                <Text className="text-yellow-400 mr-1">⭐</Text>
                <Text className="text-white font-bold text-sm">{partner.rating.toFixed(1)}</Text>
              </View>
              <Text className="text-neutral-500 text-xs">{partner.totalRides} rides</Text>
            </View>
          </View>
        </View>
      )}

      {/* Trip Completed Message - Enhanced */}
      {state === 'TRIP_COMPLETED' && (
        <View className="bg-gradient-to-br from-emerald-500/20 to-transparent rounded-3xl p-6 mb-4 border border-emerald-500/30">
          <Text className="text-emerald-400 font-bold text-center text-lg mb-2">
            🎉 Trip Completed!
          </Text>
          <Text className="text-neutral-400 text-center text-sm">
            Thank you for riding with us
          </Text>
        </View>
      )}

      {/* Cancelled Message - Enhanced */}
      {state === 'CANCELLED' && (
        <View className="bg-gradient-to-br from-red-500/20 to-transparent rounded-3xl p-6 mb-4 border border-red-500/30">
          <Text className="text-red-400 font-bold text-center text-lg">
            ❌ Ride Cancelled
          </Text>
        </View>
      )}

      {/* Cancel Button - Enhanced */}
      {canCancel && onCancel && (
        <Pressable
          onPress={onCancel}
          className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl py-4 active:bg-red-500/20"
        >
          <Text className="text-red-400 font-bold text-center text-base tracking-wide">
            ❌ Cancel Ride
          </Text>
        </Pressable>
      )}
    </View>
  );
}

