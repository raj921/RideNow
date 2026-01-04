import React from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import type { PartnerStatus } from '@ride-hailing/shared-types';

interface StatusToggleProps {
  status: PartnerStatus;
  onToggle: (online: boolean) => void;
  disabled?: boolean;
}

export function StatusToggle({ status, onToggle, disabled }: StatusToggleProps) {
  const isOnline = status === 'ONLINE' || status === 'BUSY';

  return (
    <Pressable
      onPress={() => !disabled && onToggle(!isOnline)}
      disabled={disabled}
      className={`rounded-3xl p-6 border-2 ${
        isOnline 
          ? 'bg-gradient-to-br from-brand-500/20 to-brand-600/10 border-brand-500/40' 
          : 'bg-neutral-900/80 border-neutral-700/50'
      } shadow-level-2`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`w-5 h-5 rounded-full mr-4 ${
            isOnline ? 'bg-brand-500 shadow-glow' : 'bg-neutral-500'
          }`} />
          <View className="flex-1">
            <Text className={`font-bold text-xl tracking-tight ${
              isOnline ? 'text-brand-400' : 'text-neutral-400'
            }`}>
              {status === 'BUSY' ? 'On Trip' : isOnline ? 'Online' : 'Offline'}
            </Text>
            <Text className="text-neutral-500 text-sm mt-1">
              {isOnline ? 'Accepting ride requests' : 'Tap to go online'}
            </Text>
          </View>
        </View>
        <Switch
          value={isOnline}
          onValueChange={onToggle}
          disabled={disabled || status === 'BUSY'}
          trackColor={{ false: '#3f3f46', true: '#4666FF' }}
          thumbColor={isOnline ? '#ffffff' : '#a1a1aa'}
        />
      </View>
    </Pressable>
  );
}