interface StatsCardsProps {
  stats: {
    totalRides: number;
    activeRides: number;
    completedRides: number;
    cancelledRides: number;
    onlinePartners: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: 'Active Rides',
      value: stats.activeRides,
      icon: '🚗',
      gradient: 'from-blue-500/10 via-blue-600/5 to-transparent',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      textColor: 'text-blue-400',
      glowColor: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    },
    {
      label: 'Online Partners',
      value: stats.onlinePartners,
      icon: '👥',
      gradient: 'from-green-500/10 via-green-600/5 to-transparent',
      borderColor: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      textColor: 'text-green-400',
      glowColor: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    },
    {
      label: 'Completed Today',
      value: stats.completedRides,
      icon: '✅',
      gradient: 'from-emerald-500/10 via-emerald-600/5 to-transparent',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      textColor: 'text-emerald-400',
      glowColor: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    },
    {
      label: 'Cancelled',
      value: stats.cancelledRides,
      icon: '❌',
      gradient: 'from-red-500/10 via-red-600/5 to-transparent',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      textColor: 'text-red-400',
      glowColor: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} backdrop-blur-sm border ${card.borderColor} rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:${card.glowColor} group`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
          
          {/* Content */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.iconBg} p-3 rounded-xl ${card.textColor} text-2xl transition-transform group-hover:scale-110`}>
                {card.icon}
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
                  {card.label}
                </div>
              </div>
            </div>
            <div className={`text-4xl font-bold ${card.textColor} mb-1 font-mono tabular-nums`}>
              {card.value}
            </div>
            <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden mt-3">
              <div 
                className={`h-full bg-gradient-to-r ${card.textColor.replace('text-', 'from-')} to-transparent transition-all duration-1000`}
                style={{ width: `${Math.min((card.value / 10) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}