import type { Cancellation, CancelledBy } from '@ride-hailing/shared-types';
import { CANCELLATION_REASON_LABELS } from '@ride-hailing/shared-types';

interface CancellationsTableProps {
  cancellations: Cancellation[];
}

export function CancellationsTable({ cancellations }: CancellationsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider">
            <th className="pb-3 pr-4 font-medium">Ride ID</th>
            <th className="pb-3 pr-4 font-medium">Cancelled By</th>
            <th className="pb-3 pr-4 font-medium">Reason</th>
            <th className="pb-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {cancellations.map((cancellation) => (
            <tr key={cancellation.id} className="hover:bg-zinc-800/50">
              <td className="py-3 pr-4">
                <span className="font-mono text-sm text-zinc-300">
                  {cancellation.rideId.slice(-8)}
                </span>
              </td>
              <td className="py-3 pr-4">
                <CancelledByBadge cancelledBy={cancellation.cancelledBy} />
              </td>
              <td className="py-3 pr-4">
                <span className="text-sm text-zinc-300">
                  {CANCELLATION_REASON_LABELS[cancellation.reason]}
                </span>
              </td>
              <td className="py-3">
                <span className="text-sm text-zinc-400">
                  {formatDate(cancellation.timestamp)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {cancellations.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          No cancellations found
        </div>
      )}
    </div>
  );
}

function CancelledByBadge({ cancelledBy }: { cancelledBy: CancelledBy }) {
  const colors: Record<CancelledBy, string> = {
    CUSTOMER: 'bg-purple-500/20 text-purple-400',
    PARTNER: 'bg-orange-500/20 text-orange-400',
    SYSTEM: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[cancelledBy]}`}>
      {cancelledBy}
    </span>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

