import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, Volume2, VolumeX, 
  Skull, Clock, Terminal, Menu, Palette, Maximize, 
  Minimize, Monitor, Eye
} from 'lucide-react';

export default function Navbar({ 
  stats, 
  wsConnected, 
  soundEnabled,
  setSoundEnabled,
  onOpenSimModal,
  onOpenTerminal,
  onToggleMobileMenu,
  currentTheme,
  onChangeTheme,
  matrixRainEnabled,
  onToggleMatrixRain,
  crtEnabled,
  onToggleCrt
}) {
  const [timeUtc, setTimeUtc] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().replace('GMT', 'UTC').split(' ')[4] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getDefconStyle = (level) => {
    switch (level) {
      case 1:
        return {
          bg: 'rgba(255, 51, 102, 0.2)',
          border: '#ff3366',
          text: '#ff3366',
          shadow: '0 0 16px rgba(255, 51, 102, 0.5)',
          label: 'DEFCON 1 // CRITICAL'
        };
      case 2:
        return {
          bg: 'rgba(255, 153, 0, 0.2)',
          border: '#ff9900',
          text: '#ff9900',
          shadow: '0 0 16px rgba(255, 153, 0, 0.4)',
          label: 'DEFCON 2 // SEVERE'
        };
      case 3:
        return {
          bg: 'rgba(234, 179, 8, 0.15)',
          border: '#eab308',
          text: '#eab308',
          shadow: '0 0 12px rgba(234, 179, 8, 0.3)',
          label: 'DEFCON 3 // ELEVATED'
        };
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '#10b981',
          text: '#10b981',
          shadow: '0 0 12px rgba(16, 185, 129, 0.3)',
          label: 'DEFCON 5 // SECURE'
        };
    }
  };

  const defcon = getDefconStyle(stats?.defcon_level || 3);

  return (
    <header style={{
      minHeight: '68px',
      background: 'rgba(10, 15, 29, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      gap: '12px',
      flexWrap: 'wrap',
      zIndex: 50
    }}>
      {/* Brand & Mobile Hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Hamburger Menu on Mobile */}
        <button
          onClick={onToggleMobileMenu}
          className="btn btn-outline btn-sm"
          style={{ padding: '6px 8px' }}
          title="Toggle Navigation Menu"
        >
          <Menu size={18} color="var(--accent-cyan)" />
        </button>

        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(79, 172, 254, 0.1))',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow-cyan)'
        }}>
          <ShieldAlert size={22} color="var(--accent-cyan)" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '18px', 
              fontWeight: 800, 
              letterSpacing: '1px',
              color: '#f0f4fc' 
            }}>
              SENTINEL<span style={{ color: 'var(--accent-cyan)' }}>-X</span>
            </h1>
            <span style={{
              fontSize: '9.5px',
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0, 242, 254, 0.1)',
              border: '1px solid var(--border-glow)',
              color: 'var(--accent-cyan)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontWeight: 700
            }}>
              TIER 3
            </span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            AUTONOMOUS CYBER DEFENSE
          </div>
        </div>
      </div>

      {/* Middle: DEFCON Badge & Ingestion Velocity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 12px',
          background: defcon.bg,
          border: `1px solid ${defcon.border}`,
          borderRadius: '6px',
          boxShadow: defcon.shadow,
          fontFamily: 'var(--font-display)',
          fontSize: '13px',
          fontWeight: 700,
          color: defcon.text
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: defcon.border
          }} className="animate-pulse-glow" />
          {defcon.label}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          background: 'rgba(18, 25, 44, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px'
        }}>
          <Activity size={13} color="var(--accent-cyan)" />
          <span style={{ color: 'var(--text-muted)' }}>EPS:</span>
          <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{stats?.current_eps || 240}</span>
        </div>
      </div>

      {/* Right Controls: Hacker Themes, Matrix Rain, Shell, Simulator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Hacker Theme Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Palette size={14} color="var(--accent-cyan)" />
          <select
            value={currentTheme}
            onChange={(e) => onChangeTheme(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              borderRadius: '5px',
              padding: '4px 8px',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="cyber">🔵 Cyber Stealth</option>
            <option value="matrix">🟢 Matrix Hacker</option>
            <option value="blood">🔴 Blood Breach</option>
            <option value="amber">🟡 Retro Amber</option>
          </select>
        </div>

        {/* Matrix Digital Rain Toggle */}
        <button
          onClick={onToggleMatrixRain}
          className={`btn ${matrixRainEnabled ? 'btn-primary' : 'btn-outline'} btn-sm`}
          style={{ padding: '5px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
          title="Toggle Falling Matrix Digital Rain"
        >
          <span>RAIN: {matrixRainEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* CRT Scanline Toggle */}
        <button
          onClick={onToggleCrt}
          className={`btn ${crtEnabled ? 'btn-primary' : 'btn-outline'} btn-sm`}
          style={{ padding: '5px 8px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
          title="Toggle CRT Retro Scanline Raster"
        >
          <span>CRT: {crtEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* Interactive Cyber CLI Button */}
        <button
          onClick={onOpenTerminal}
          className="btn btn-outline btn-sm"
          style={{
            padding: '5px 10px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            borderColor: 'var(--accent-cyan)',
            color: 'var(--accent-cyan)'
          }}
          title="Open Interactive Cyber Shell (Ctrl+`)"
        >
          <Terminal size={13} />
          <span>&gt;_ SHELL</span>
        </button>

        {/* Red Team Attack Simulator Button */}
        <button 
          onClick={onOpenSimModal}
          className="btn btn-danger btn-sm"
          style={{ padding: '5px 10px' }}
        >
          <Skull size={13} />
          <span>Attack Simulator</span>
        </button>

        {/* Sound toggle */}
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? "Audio Alerts Enabled" : "Audio Alerts Muted"}
          className="btn btn-outline btn-sm"
          style={{ padding: '5px 8px' }}
        >
          {soundEnabled ? <Volume2 size={15} color="var(--accent-cyan)" /> : <VolumeX size={15} color="#64748b" />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="btn btn-outline btn-sm"
          style={{ padding: '5px 8px' }}
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
        </button>
      </div>
    </header>
  );
}
