import { useEffect, useState } from 'react';
import type { RideWithDetails, RideStateTransition } from '@ride-hailing/shared-types';
import { RIDE_STATE_LABELS } from '@ride-hailing/shared-types';
import { StateTimeline } from './StateTimeline';
import { useApi } from '../hooks/useApi';

interface RideDetailsProps {
  rideId: string;
  onClose: () => void;
}

export function RideDetails({ rideId, onClose }: RideDetailsProps) {
  const [ride, setRide] = useState<RideWithDetails | null>(null);
  const [transitions, setTransitions] = useState<RideStateTransition[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchRideDetails, fetchRideTransitions } = useApi();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [rideData, transitionsData] = await Promise.all([
        fetchRideDetails(rideId),
        fetchRideTransitions(rideId),
      ]);
      setRide(rideData);
      setTransitions(transitionsData);
      setLoading(false);
    };
    load();
  }, [rideId]);

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="h-4 bg-zinc-800 rounded w-2/3" />
          <div className="h-4 bg-zinc-800 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 text-center text-zinc-500">
        Ride not found
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div>
          <h3 className="text-white font-semibold">Ride Details</h3>
          <p className="text-zinc-500 text-sm font-mono">{ride.id}</p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors p-2"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Status */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Status</div>
          <StatusBadge state={ride.state} />
        </div>

        {/* Locations */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Route</div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
              <div>
                <div className="text-xs text-zinc-500">Pickup</div>
                <div className="text-white text-sm">{ride.pickup.formatted}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
              <div>
                <div className="text-xs text-zinc-500">Dropoff</div>
                <div className="text-white text-sm">{ride.dropoff.formatted}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Partner */}
        {ride.partner && (
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Partner</div>
            <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                👤
              </div>
              <div>
                <div className="text-white font-medium">{ride.partner.name}</div>
                <div className="text-zinc-500 text-sm">
                  {ride.partner.vehicleModel} • {ride.partner.vehicleNumber}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer */}
        {ride.customer && (
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Customer</div>
            <div className="bg-zinc-800/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center">
                🧑
              </div>
              <div>
                <div className="text-white font-medium">{ride.customer.name}</div>
                <div className="text-zinc-500 text-sm">{ride.customer.phone}</div>
              </div>
            </div>
          </div>
        )}

        {/* Fare */}
        {ride.fare && (
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Fare</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">₹{ride.fare}</span>
              {ride.distanceKm && (
                <span className="text-zinc-500 text-sm">
                  ({ride.distanceKm.toFixed(1)} km)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cancellation */}
        {ride.cancellation && (
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Cancellation</div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-400 font-medium">
                Cancelled by {ride.cancellation.cancelledBy}
              </div>
              <div className="text-zinc-400 text-sm">
                Reason: {ride.cancellation.reason}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-3">State History</div>
          <StateTimeline transitions={transitions} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: string }) {
  const colors: Record<string, string> = {
    REQUESTED: 'bg-amber-500/20 text-amber-400',
    SEARCHING: 'bg-amber-500/20 text-amber-400',
    PARTNER_ASSIGNED: 'bg-blue-500/20 text-blue-400',
    PARTNER_ARRIVED: 'bg-blue-500/20 text-blue-400',
    TRIP_STARTED: 'bg-green-500/20 text-green-400',
    TRIP_COMPLETED: 'bg-emerald-500/20 text-emerald-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${colors[state] || 'bg-zinc-700 text-zinc-300'}`}>
      {RIDE_STATE_LABELS[state as keyof typeof RIDE_STATE_LABELS] || state}
    </span>
  );
}

