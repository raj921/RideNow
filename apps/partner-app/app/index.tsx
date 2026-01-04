import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, Pressable, Modal } from 'react-native';
import { useSocket } from '../hooks/useSocket';
import { useLocationStream } from '../hooks/useLocationStream';
import { usePartnerStore, AVAILABLE_PARTNERS, DEFAULT_PARTNER_ID } from '../stores/partnerStore';
import { StatusToggle } from '../components/StatusToggle';
import { RideRequestCard } from '../components/RideRequestCard';
import { ActiveRideCard } from '../components/ActiveRideCard';
import type { CancellationReason } from '@ride-hailing/shared-types';

export default function PartnerHomeScreen() {
  const [selectedPartnerId, setSelectedPartnerId] = useState(DEFAULT_PARTNER_ID);
  const [showPartnerPicker, setShowPartnerPicker] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  const {
    goOnline,
    goOffline,
    acceptRide,
    rejectRide,
    arriveAtPickup,
    startTrip,
    completeTrip,
    cancelRide,
    sendLocationUpdate,
  } = useSocket(selectedPartnerId);

  const {
    partner,
    status,
    ride,
    incomingRide,
    currentLocation,
    isLocationStreaming,
    error,
    lastLocationUpdate,
  } = usePartnerStore();

  // Location streaming
  const { getCurrentLocation } = useLocationStream({
    onLocationUpdate: sendLocationUpdate,
    enabled: status !== 'OFFLINE',
  });

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

  const handleToggleOnline = (online: boolean) => {
    if (online) {
      const location = getCurrentLocation();
      goOnline(location);
    } else {
      goOffline();
    }
  };

  const handleAcceptRide = () => {
    if (incomingRide) {
      acceptRide(incomingRide.id);
    }
  };

  const handleRejectRide = () => {
    if (incomingRide) {
      rejectRide(incomingRide.id);
    }
  };

  const handleCancelRide = () => {
    cancelRide('VEHICLE_ISSUE');
    setShowCancelModal(false);
  };

  const selectedPartnerName = AVAILABLE_PARTNERS.find(p => p.id === selectedPartnerId)?.name || 'Unknown';

  return (
    <SafeAreaView className="flex-1 bg-neutral-950">
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header - Enhanced */}
        <View className="px-5 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-4xl font-bold text-white tracking-tight">Partner</Text>
              <Text className="text-neutral-400 text-sm mt-1">Drive & Earn</Text>
            </View>
            <View className="flex-row items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <View className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-brand-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <Text className={`text-xs font-semibold uppercase tracking-wide ${
                connectionStatus === 'connected' ? 'text-brand-400' :
                connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {connectionStatus === 'connected' ? 'Live' :
                 connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
              </Text>
            </View>
          </View>

          {/* Partner Selector - Enhanced */}
          <Pressable
            onPress={() => setShowPartnerPicker(true)}
            className="bg-neutral-900/80 rounded-2xl px-4 py-3 self-start border border-neutral-800/50 flex-row items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-brand-600/10 items-center justify-center mr-3 border border-brand-500/30">
              <Text className="text-2xl">🚗</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">{selectedPartnerName}</Text>
              <Text className="text-neutral-500 text-xs font-mono mt-0.5">{selectedPartnerId}</Text>
            </View>
            <Text className="text-neutral-500 text-lg">▼</Text>
          </Pressable>
        </View>

        {/* Content */}
        <View className="px-5 pb-8 flex-1">
          {/* Status Toggle */}
          <View className="mb-4">
            <StatusToggle
              status={status}
              onToggle={handleToggleOnline}
              disabled={status === 'BUSY'}
            />
          </View>

          {/* Location Streaming Indicator */}
          {isLocationStreaming && (
            <View className="bg-zinc-800/50 rounded-xl p-3 mb-4 flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
              <Text className="text-zinc-400 text-sm flex-1">
                Streaming location
              </Text>
              {currentLocation && (
                <Text className="text-zinc-500 text-xs">
                  {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </Text>
              )}
            </View>
          )}

          {/* Stats - Enhanced */}
          {partner && !ride && !incomingRide && (
            <View className="bg-gradient-to-br from-neutral-900/90 to-neutral-900/60 rounded-3xl p-6 mb-4 border border-neutral-800/50">
              <Text className="text-neutral-500 text-xs uppercase tracking-wider mb-4 font-semibold">Your Performance</Text>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <Text className="text-white text-4xl font-bold font-mono">{partner.totalRides}</Text>
                  <Text className="text-neutral-400 text-sm mt-1">Total Rides</Text>
                </View>
                <View className="w-px bg-neutral-700" />
                <View className="items-center flex-1">
                  <View className="flex-row items-center bg-yellow-500/10 px-3 py-1 rounded-lg mb-1">
                    <Text className="text-yellow-400 mr-1 text-lg">⭐</Text>
                    <Text className="text-white text-4xl font-bold font-mono">{partner.rating.toFixed(1)}</Text>
                  </View>
                  <Text className="text-neutral-400 text-sm mt-1">Rating</Text>
                </View>
              </View>
            </View>
          )}

          {/* Incoming Ride Request */}
          {incomingRide && (
            <View className="mb-4">
              <RideRequestCard
                ride={incomingRide}
                onAccept={handleAcceptRide}
                onReject={handleRejectRide}
              />
            </View>
          )}

          {/* Active Ride */}
          {ride && !incomingRide && (
            <ActiveRideCard
              ride={ride}
              onArrive={arriveAtPickup}
              onStart={startTrip}
              onComplete={completeTrip}
              onCancel={() => setShowCancelModal(true)}
            />
          )}

          {/* Idle State - Enhanced */}
          {status === 'ONLINE' && !ride && !incomingRide && (
            <View className="bg-gradient-to-br from-brand-500/10 to-transparent rounded-3xl p-8 border border-brand-500/30 items-center">
              <Text className="text-6xl mb-4">🚗</Text>
              <Text className="text-white text-xl font-bold mb-2 tracking-tight">
                Ready for Rides
              </Text>
              <Text className="text-neutral-400 text-center text-sm">
                You'll be notified when a new ride request comes in
              </Text>
            </View>
          )}

          {/* Offline State - Enhanced */}
          {status === 'OFFLINE' && (
            <View className="bg-gradient-to-br from-neutral-800/80 to-neutral-800/40 rounded-3xl p-8 border border-neutral-700/50 items-center">
              <Text className="text-6xl mb-4">💤</Text>
              <Text className="text-white text-xl font-bold mb-2 tracking-tight">
                You're Offline
              </Text>
              <Text className="text-neutral-400 text-center text-sm">
                Toggle online above to start receiving ride requests
              </Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-4">
              <Text className="text-red-400 text-center">{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Partner Picker Modal */}
      <Modal
        visible={showPartnerPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPartnerPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-zinc-900 rounded-t-3xl p-6">
            <View className="w-12 h-1.5 bg-zinc-700 rounded-full self-center mb-6" />
            <Text className="text-white text-xl font-bold mb-4">Select Partner</Text>
            <View className="gap-2 mb-6">
              {AVAILABLE_PARTNERS.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setSelectedPartnerId(p.id);
                    setShowPartnerPicker(false);
                  }}
                  className={`p-4 rounded-xl flex-row items-center ${
                    selectedPartnerId === p.id
                      ? 'bg-blue-500/20 border border-blue-500'
                      : 'bg-zinc-800/50 border border-zinc-700'
                  }`}
                >
                  <View className="w-10 h-10 rounded-full bg-zinc-700 items-center justify-center mr-3">
                    <Text>🚗</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">{p.name}</Text>
                    <Text className="text-zinc-500 text-sm">{p.id}</Text>
                  </View>
                  {selectedPartnerId === p.id && (
                    <Text className="text-blue-400">✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowPartnerPicker(false)}
              className="bg-zinc-800 rounded-xl py-4"
            >
              <Text className="text-white font-semibold text-center">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
          <View className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-white text-xl font-bold mb-2">Cancel Ride?</Text>
            <Text className="text-zinc-400 mb-6">
              Are you sure you want to cancel this ride? This may affect your rating.
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowCancelModal(false)}
                className="flex-1 bg-zinc-800 rounded-xl py-3"
              >
                <Text className="text-white font-semibold text-center">Go Back</Text>
              </Pressable>
              <Pressable
                onPress={handleCancelRide}
                className="flex-1 bg-red-500 rounded-xl py-3"
              >
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

