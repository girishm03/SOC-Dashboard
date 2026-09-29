import React from 'react';
import { 
  AlertOctagon, ShieldCheck, Activity, Clock, 
  Server, Lock, ArrowUpRight, TrendingUp
} from 'lucide-react';

export default function MetricsHeader({ stats }) {
  const cards = [
    {
      title: 'ACTIVE INCIDENTS',
      value: stats?.active_incidents || 0,
      subtext: `${stats?.critical_alerts || 0} Critical · ${stats?.high_alerts || 0} High`,
      icon: AlertOctagon,
      color: (stats?.critical_alerts || 0) > 0 ? '#ff3366' : '#ff9900',
      glow: (stats?.critical_alerts || 0) > 0 ? 'var(--shadow-glow-critical)' : 'none'
    },
    {
      title: 'INGESTION VELOCITY',
      value: `${stats?.current_eps || 240} EPS`,
      subtext: 'Real-time SIEM throughput',
      icon: Activity,
      color: '#00f2fe',
      glow: 'var(--shadow-glow-cyan)'
    },
    {
      title: 'BLOCKED ATTACKS (24H)',
      value: stats?.blocked_attacks_today?.toLocaleString() || '1,432',
      subtext: 'Edge WAF & Firewall Drops',
      icon: ShieldCheck,
      color: '#10b981',
      glow: 'none'
    },
    {
      title: 'MTTD / MTTR',
      value: `${stats?.mttd_minutes || 4.2}m / ${stats?.mttr_minutes || 18.5}m`,
      subtext: 'Detection & Containment SLA',
      icon: Clock,
      color: '#8b5cf6',
      glow: 'none'
    },
    {
      title: 'MONITORED FLEET',
      value: `${stats?.total_endpoints || 7} Assets`,
      subtext: stats?.compromised_endpoints > 0 
        ? `${stats.compromised_endpoints} Compromised · ${stats?.isolated_endpoints || 0} Isolated`
        : `100% Healthy · ${stats?.isolated_endpoints || 0} Isolated`,
      icon: Server,
      color: (stats?.compromised_endpoints || 0) > 0 ? '#ff3366' : '#38bdf8',
      glow: (stats?.compromised_endpoints || 0) > 0 ? 'var(--shadow-glow-critical)' : 'none'
    }
  ];

  return (
    <div className="grid-metrics">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className="glass-panel"
            style={{
              padding: '18px 20px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: card.glow !== 'none' ? card.glow : undefined
            }}
          >
            {/* Ambient accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${card.color}, transparent)`
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontFamily: 'var(--font-mono)', 
                color: 'var(--text-muted)',
                letterSpacing: '0.8px',
                fontWeight: 600
              }}>
                {card.title}
              </span>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: `${card.color}15`,
                border: `1px solid ${card.color}35`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={16} color={card.color} />
              </div>
            </div>

            <div style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              fontFamily: 'var(--font-display)',
              color: '#f0f4fc',
              letterSpacing: '0.5px',
              marginBottom: '4px'
            }}>
              {card.value}
            </div>

            <div style={{ 
              fontSize: '11px', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
