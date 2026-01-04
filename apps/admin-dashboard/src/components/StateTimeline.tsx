import type { RideStateTransition, RideState } from '@ride-hailing/shared-types';
import { RIDE_STATE_LABELS } from '@ride-hailing/shared-types';

interface StateTimelineProps {
  transitions: RideStateTransition[];
}

export function StateTimeline({ transitions }: StateTimelineProps) {
  if (transitions.length === 0) {
    return (
      <div className="text-center py-4 text-zinc-500 text-sm">
        No state transitions recorded
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {transitions.map((transition, index) => (
        <div key={transition.id} className="flex gap-3">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${getStateColor(transition.toState)}`} />
            {index < transitions.length - 1 && (
              <div className="w-0.5 h-8 bg-zinc-700" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm">
                {RIDE_STATE_LABELS[transition.toState]}
              </span>
              <span className="text-zinc-500 text-xs">
                {formatTime(transition.timestamp)}
              </span>
            </div>
            {transition.triggeredBy && (
              <span className="text-zinc-500 text-xs">
                by {transition.triggeredBy}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getStateColor(state: RideState): string {
  switch (state) {
    case 'REQUESTED':
      return 'bg-zinc-500';
    case 'SEARCHING':
      return 'bg-amber-500';
    case 'PARTNER_ASSIGNED':
    case 'PARTNER_ARRIVED':
      return 'bg-blue-500';
    case 'TRIP_STARTED':
      return 'bg-green-500';
    case 'TRIP_COMPLETED':
      return 'bg-emerald-500';
    case 'CANCELLED':
      return 'bg-red-500';
    default:
      return 'bg-zinc-500';
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

