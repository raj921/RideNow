import type { Ride, RideState } from '@ride-hailing/shared-types';
import { RIDE_STATE_LABELS } from '@ride-hailing/shared-types';

interface RidesTableProps {
  rides: Ride[];
  onRideSelect?: (ride: Ride) => void;
  selectedRideId?: string;
}

export function RidesTable({ rides, onRideSelect, selectedRideId }: RidesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm z-10">
          <tr className="text-left text-xs text-neutral-500 uppercase tracking-wider border-b border-neutral-800">
            <th className="pb-3 pr-4 font-semibold">ID</th>
            <th className="pb-3 pr-4 font-semibold">Status</th>
            <th className="pb-3 pr-4 font-semibold">Pickup</th>
            <th className="pb-3 pr-4 font-semibold">Dropoff</th>
            <th className="pb-3 pr-4 font-semibold">Fare</th>
            <th className="pb-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/50">
          {rides.map((ride) => (
            <tr
              key={ride.id}
              onClick={() => onRideSelect?.(ride)}
              className={`cursor-pointer transition-all duration-150 ${selectedRideId === ride.id
                  ? 'bg-brand-500/10 border-l-2 border-brand-500'
                  : 'hover:bg-neutral-800/50'
                }`}
            >
              <td className="py-4 pr-4">
                <span className="font-mono text-sm text-brand-400 font-medium">
                  {ride.id.slice(-8)}
                </span>
              </td>
              <td className="py-4 pr-4">
                <StatusBadge state={ride.state} />
              </td>
              <td className="py-4 pr-4">
                <span className="text-sm text-neutral-300 max-w-[200px] truncate block">
                  {ride.pickup.formatted}
                </span>
              </td>
              <td className="py-4 pr-4">
                <span className="text-sm text-neutral-300 max-w-[200px] truncate block">
                  {ride.dropoff.formatted}
                </span>
              </td>
              <td className="py-4 pr-4">
                <span className="text-sm text-white font-semibold font-mono">
                  {ride.fare ? `₹${ride.fare}` : '-'}
                </span>
              </td>
              <td className="py-4">
                <span className="text-xs text-neutral-400 font-mono">
                  {formatDate(ride.createdAt)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {rides.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-2 opacity-50">📭</div>
          <div className="text-neutral-500">No rides found</div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ state }: { state: RideState }) {
  const configs: Record<RideState, { bg: string; text: string; border: string; icon: string }> = {
    REQUESTED: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: '📝'
    },
    SEARCHING: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: '🔍'
    },
    PARTNER_ASSIGNED: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      icon: '🚗'
    },
    PARTNER_ARRIVED: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      icon: '📍'
    },
    TRIP_STARTED: {
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      border: 'border-green-500/30',
      icon: '🚀'
    },
    TRIP_COMPLETED: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: '✅'
    },
    CANCELLED: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/30',
      icon: '❌'
    },
  };

  const config = configs[state];

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span>{config.icon}</span>
      <span>{RIDE_STATE_LABELS[state]}</span>
    </span>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString();
}

