import React from 'react';
import { 
  LayoutDashboard, AlertTriangle, Server, Terminal, 
  Globe, Shield, Search, Flame, Radio, BookOpen, 
  TerminalSquare, X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  stats, 
  isOpen, 
  onClose,
  onOpenTerminal 
}) {
  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { 
      id: 'incidents', 
      label: 'Incident Triage', 
      icon: AlertTriangle, 
      badge: stats?.active_incidents,
      badgeColor: (stats?.critical_alerts || 0) > 0 ? '#ff3366' : '#ff9900'
    },
    { 
      id: 'endpoints', 
      label: 'Fleet & Assets', 
      icon: Server, 
      badge: stats?.compromised_endpoints > 0 ? `${stats.compromised_endpoints} ALERT` : null,
      badgeColor: '#ff3366'
    },
    { id: 'scanner', label: 'Port & Vuln Auditor', icon: Radio },
    { id: 'playbooks', label: 'SOAR Playbooks', icon: BookOpen },
    { id: 'logs', label: 'SIEM Log Stream', icon: Terminal },
    { id: 'threat_map', label: 'Global Attack Map', icon: Globe },
    { id: 'mitre', label: 'MITRE ATT&CK', icon: Flame },
    { id: 'threat_intel', label: 'Threat Intelligence', icon: Search },
    { id: 'firewall', label: 'Firewall Drop Table', icon: Shield }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onClose} 
        />
      )}

      <aside 
        className={`sidebar-drawer ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          zIndex: 1050
        }}
      >
        {/* Navigation Header */}
        <div style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px 10px 8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              letterSpacing: '1px'
            }}>
              OPERATIONAL MODULES
            </span>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
              className="mobile-close-btn"
            >
              <X size={18} />
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onClose) onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: isActive 
                    ? 'linear-gradient(90deg, rgba(0, 242, 254, 0.15), rgba(0, 242, 254, 0.03))' 
                    : 'transparent',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--border-glow)' : 'transparent',
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease-out'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} color={isActive ? 'var(--accent-cyan)' : '#64748b'} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '10px',
                    background: item.badgeColor ? `${item.badgeColor}22` : 'rgba(0, 242, 254, 0.15)',
                    border: `1px solid ${item.badgeColor || 'var(--accent-cyan)'}`,
                    color: item.badgeColor || 'var(--accent-cyan)'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick CLI Shell Launch Button */}
          <button
            onClick={() => {
              if (onOpenTerminal) onOpenTerminal();
              if (onClose) onClose();
            }}
            className="btn btn-outline"
            style={{
              marginTop: '8px',
              padding: '9px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              borderColor: 'var(--accent-cyan)',
              color: 'var(--accent-cyan)'
            }}
          >
            <TerminalSquare size={16} />
            <span>&gt;_ Interactive CLI Shell</span>
          </button>
        </div>

        {/* Analyst Profile & Engine Footnote */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(7, 10, 18, 0.5)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '10px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-cyan), #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 800,
              fontSize: '12px',
              fontFamily: 'var(--font-mono)'
            }}>
              #0
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4fc' }}>root@sentinel-x</div>
              <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                Tier 3 Lead Analyst
              </div>
            </div>
          </div>
          <div style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <span>SENTINEL-X v2.4</span>
            <span>CYBER SECURE</span>
          </div>
        </div>
      </aside>
    </>
  );
}
