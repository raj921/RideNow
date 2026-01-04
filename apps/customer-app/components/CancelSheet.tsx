import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import type { CancellationReason } from '@ride-hailing/shared-types';
import { CANCELLATION_REASON_LABELS } from '@ride-hailing/shared-types';

interface CancelSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: CancellationReason) => void;
}

const CUSTOMER_REASONS: CancellationReason[] = [
  'CUSTOMER_CHANGED_MIND',
  'PARTNER_NOT_RESPONDING',
  'PARTNER_TOO_FAR',
  'OTHER',
];

export function CancelSheet({ visible, onClose, onConfirm }: CancelSheetProps) {
  const [selectedReason, setSelectedReason] = useState<CancellationReason | null>(null);

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason);
      setSelectedReason(null);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-zinc-900 rounded-t-3xl p-6">
          <View className="w-12 h-1.5 bg-zinc-700 rounded-full self-center mb-6" />
          
          <Text className="text-white text-xl font-bold mb-2">
            Cancel Ride?
          </Text>
          <Text className="text-zinc-400 mb-6">
            Please let us know why you're cancelling
          </Text>

          <View className="gap-3 mb-6">
            {CUSTOMER_REASONS.map((reason) => (
              <Pressable
                key={reason}
                onPress={() => setSelectedReason(reason)}
                className={`p-4 rounded-xl border ${
                  selectedReason === reason
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-zinc-800/50 border-zinc-700'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedReason === reason ? 'text-green-400' : 'text-white'
                  }`}
                >
                  {CANCELLATION_REASON_LABELS[reason]}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 bg-zinc-800 rounded-xl py-4 active:opacity-70"
            >
              <Text className="text-white font-semibold text-center">
                Go Back
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={!selectedReason}
              className={`flex-1 rounded-xl py-4 active:opacity-70 ${
                selectedReason ? 'bg-red-500' : 'bg-red-500/30'
              }`}
            >
              <Text
                className={`font-semibold text-center ${
                  selectedReason ? 'text-white' : 'text-red-300'
                }`}
              >
                Confirm Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

