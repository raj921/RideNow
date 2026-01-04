import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useRideStore, MOCK_CUSTOMER_ID } from '../stores/rideStore';
import { LocationInput, QuickLocationPicker, DEMO_LOCATIONS } from '../components/LocationInput';
import { RideStateCard } from '../components/RideStateCard';
import { CancelSheet } from '../components/CancelSheet';
import { MapView } from '../components/MapView';
import type { Address, CancellationReason } from '@ride-hailing/shared-types';

export default function HomeScreen() {
  const { bookRide, cancelRide, isConnected } = useSocket();
  const { ride, partner, partnerLocation, pickup, dropoff, setPickup, setDropoff, isBooking, setIsBooking, error, reset } = useRideStore();

  const [pickupText, setPickupText] = useState('');
  const [dropoffText, setDropoffText] = useState('');
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/health');
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      } catch {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePickupSelect = (location: { name: string; lat: number; lng: number }) => {
    setPickupText(location.name);
    setPickup({ formatted: location.name, lat: location.lat, lng: location.lng });
  };

  const handleDropoffSelect = (location: { name: string; lat: number; lng: number }) => {
    setDropoffText(location.name);
    setDropoff({ formatted: location.name, lat: location.lat, lng: location.lng });
  };

  const handleBookRide = () => {
    if (!pickup || !dropoff) return;
    setIsBooking(true);
    bookRide(pickup, dropoff);
  };

  const handleCancelRide = (reason: CancellationReason) => {
    cancelRide(reason);
    setShowCancelSheet(false);
  };

  const handleNewRide = () => {
    reset();
    setPickupText('');
    setDropoffText('');
  };

  const hasActiveRide = ride && !['TRIP_COMPLETED', 'CANCELLED'].includes(ride.state);
  const isRideComplete = ride?.state === 'TRIP_COMPLETED' || ride?.state === 'CANCELLED';
  const showPartnerOnMap = ride && ['PARTNER_ASSIGNED', 'PARTNER_ARRIVED', 'TRIP_STARTED'].includes(ride.state);

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <View className="px-5 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-4xl font-bold text-white tracking-tight">RideNow</Text>
              <Text className="text-neutral-400 text-sm mt-1">Your journey starts here</Text>
            </View>
            <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <View className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-brand-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
              <Text className={`text-xs font-semibold uppercase tracking-wide ${connectionStatus === 'connected' ? 'text-brand-400' :
                connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                {connectionStatus === 'connected' ? 'Live' :
                  connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
              </Text>
            </View>
          </View>

          {/* Customer Badge */}
          <View className="bg-neutral-900/60 rounded-xl px-4 py-2 self-start border border-neutral-800/50">
            <Text className="text-neutral-500 text-xs">
              Demo User: <Text className="text-brand-400 font-semibold">{MOCK_CUSTOMER_ID}</Text>
            </Text>
          </View>
        </View>

        {/* Map - Enhanced */}
        <View className="h-72 mx-5 my-4 rounded-3xl overflow-hidden border-2 border-neutral-800/50 shadow-level-2">
          <MapView
            pickup={pickup}
            dropoff={dropoff}
            partnerLocation={partnerLocation}
            showPartner={!!showPartnerOnMap}
          />
        </View>

        {/* Content */}
        <View className="px-5 pb-8 flex-1">
          {!ride ? (
            // Booking Form
            <View>
              <Text className="text-white text-2xl font-bold mb-6 tracking-tight">
                Where to?
              </Text>

              <View className="gap-3 mb-2">
                <LocationInput
                  label="PICKUP"
                  value={pickupText}
                  onChangeText={(text) => {
                    setPickupText(text);
                    if (!text) setPickup(null);
                  }}
                  placeholder="Enter pickup location"
                  icon="pickup"
                />
                <LocationInput
                  label="DROPOFF"
                  value={dropoffText}
                  onChangeText={(text) => {
                    setDropoffText(text);
                    if (!text) setDropoff(null);
                  }}
                  placeholder="Enter destination"
                  icon="dropoff"
                />
              </View>

              {/* Quick Picks */}
              {(!pickup || !dropoff) && (
                <View className="mb-6">
                  <Text className="text-zinc-500 text-xs mb-2">
                    {!pickup ? 'Quick pickup:' : 'Quick dropoff:'}
                  </Text>
                  <QuickLocationPicker
                    onSelect={!pickup ? handlePickupSelect : handleDropoffSelect}
                    exclude={pickup?.formatted}
                  />
                </View>
              )}

              {/* Book Button - Enhanced */}
              <Pressable
                onPress={handleBookRide}
                disabled={!pickup || !dropoff || isBooking}
                className={`rounded-2xl py-5 mt-6 shadow-level-2 ${pickup && dropoff && !isBooking
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 active:opacity-90'
                  : 'bg-neutral-800'
                  }`}
              >
                <Text className={`font-bold text-center text-lg tracking-wide ${pickup && dropoff && !isBooking ? 'text-white' : 'text-neutral-500'
                  }`}>
                  {isBooking ? '⏳ Booking...' : '🚗 Book Ride'}
                </Text>
              </Pressable>

              {error && (
                <Text className="text-red-400 text-center mt-3 text-sm">
                  {error}
                </Text>
              )}
            </View>
          ) : (
            // Active Ride
            <View>
              <RideStateCard
                state={ride.state}
                partner={partner}
                partnerLocation={partnerLocation}
                pickup={ride.pickup.formatted}
                dropoff={ride.dropoff.formatted}
                onCancel={() => setShowCancelSheet(true)}
              />

              {/* New Ride Button - Enhanced */}
              {isRideComplete && (
                <Pressable
                  onPress={handleNewRide}
                  className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl py-5 mt-6 shadow-level-2 active:opacity-90"
                >
                  <Text className="text-white font-bold text-center text-lg tracking-wide">
                    ✨ Book Another Ride
                  </Text>
                </Pressable>
              )}

              {/* Fare Display - Enhanced */}
              {ride.state === 'TRIP_COMPLETED' && ride.fare && (
                <View className="bg-gradient-to-br from-brand-500/10 to-transparent rounded-3xl p-6 mt-6 border border-brand-500/30">
                  <Text className="text-neutral-400 text-center text-sm uppercase tracking-wider mb-2">Total Fare</Text>
                  <Text className="text-white text-5xl font-bold text-center font-mono">
                    ₹{ride.fare}
                  </Text>
                  {ride.distanceKm && ride.durationMinutes && (
                    <View className="flex-row justify-center gap-4 mt-4">
                      <View className="items-center">
                        <Text className="text-brand-400 font-mono text-lg font-bold">{ride.distanceKm.toFixed(1)} km</Text>
                        <Text className="text-neutral-500 text-xs">Distance</Text>
                      </View>
                      <View className="w-px bg-neutral-700" />
                      <View className="items-center">
                        <Text className="text-brand-400 font-mono text-lg font-bold">{ride.durationMinutes} min</Text>
                        <Text className="text-neutral-500 text-xs">Duration</Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cancel Sheet */}
      <CancelSheet
        visible={showCancelSheet}
        onClose={() => setShowCancelSheet(false)}
        onConfirm={handleCancelRide}
      />
    </SafeAreaView>
  );
}

