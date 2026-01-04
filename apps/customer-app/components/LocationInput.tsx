import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';

interface LocationInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: 'pickup' | 'dropoff';
  onFocus?: () => void;
}

export function LocationInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  onFocus,
}: LocationInputProps) {
  return (
    <View className="bg-neutral-900/80 backdrop-blur-xl rounded-2xl px-5 py-4 border border-neutral-800/50">
      <View className="flex-row items-center">
        <View className="mr-4">
          {icon === 'pickup' ? (
            <View className="w-5 h-5 rounded-full bg-brand-500 shadow-glow" />
          ) : (
            <View className="w-5 h-5 rounded-full bg-red-500" />
          )}
        </View>
        <View className="flex-1">
          <Text className="text-neutral-400 text-xs uppercase tracking-wider mb-1 font-semibold">{label}</Text>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#6B7280"
            className="text-white text-base font-medium"
            onFocus={onFocus}
          />
        </View>
      </View>
    </View>
  );
}

// Vijayawada Local Landmarks
export const DEMO_LOCATIONS = [
  { name: 'Benz Circle', lat: 16.5062, lng: 80.6480, surge: 1.0 },
  { name: 'PNBS (Bus Station)', lat: 16.5193, lng: 80.6305, surge: 1.3 },
  { name: 'Railway Station', lat: 16.5175, lng: 80.6199, surge: 1.2 },
  { name: 'Kanaka Durga Temple', lat: 16.5152, lng: 80.6093, surge: 1.3 },
  { name: 'MG Road', lat: 16.5100, lng: 80.6400, surge: 1.0 },
  { name: 'Governorpet', lat: 16.5080, lng: 80.6200, surge: 1.0 },
  { name: 'Patamata', lat: 16.4980, lng: 80.6650, surge: 1.0 },
  { name: 'Auto Nagar', lat: 16.4850, lng: 80.6180, surge: 1.0 },
];

interface QuickLocationPickerProps {
  onSelect: (location: { name: string; lat: number; lng: number; surge?: number }) => void;
  exclude?: string;
}

export function QuickLocationPicker({ onSelect, exclude }: QuickLocationPickerProps) {
  const locations = DEMO_LOCATIONS.filter((l) => l.name !== exclude);

  return (
    <View className="flex-row flex-wrap gap-2 mt-4">
      {locations.slice(0, 4).map((location) => (
        <Pressable
          key={location.name}
          onPress={() => onSelect(location)}
          className="bg-neutral-800/80 px-4 py-2.5 rounded-xl border border-neutral-700/50 active:bg-neutral-700 active:border-brand-500/50"
        >
          <Text className="text-neutral-300 text-sm font-medium">
            📍 {location.name}
            {location.surge > 1 && <Text className="text-yellow-400"> ⚡</Text>}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
