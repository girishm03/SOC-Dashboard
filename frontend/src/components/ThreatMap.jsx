import React, { useState } from 'react';
import { Globe, Radio, ShieldAlert, Zap, Compass, Crosshair } from 'lucide-react';

export default function ThreatMap({ geoThreats }) {
  const [selectedThreat, setSelectedThreat] = useState(null);

  // Projection helper: Convert Lat/Lng to SVG coordinates (Width: 900, Height: 450)
  const project = (lat, lng) => {
    // Equirectangular projection
    const x = ((lng + 180) / 360) * 900;
    const y = ((90 - lat) / 180) * 450;
    return { x, y };
  };

  // World continent outlines simplified SVG polygons for high-tech dark aesthetic
  const continents = [
    // North America
    "M 120 70 L 220 50 L 300 90 L 260 160 L 200 200 L 160 180 L 120 140 Z",
    // South America
    "M 220 220 L 290 230 L 320 290 L 260 380 L 220 330 Z",
    // Europe
    "M 430 70 L 510 65 L 530 110 L 480 150 L 430 130 Z",
    // Africa
    "M 440 160 L 530 160 L 550 250 L 500 330 L 450 260 Z",
    // Asia
    "M 520 60 L 750 70 L 800 150 L 680 230 L 560 170 Z",
    // Australia
    "M 710 270 L 810 270 L 800 340 L 720 340 Z"
  ];

  const getThreatColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#ff3366';
      case 'high': return '#ff9900';
      case 'medium': return '#eab308';
      default: return '#38bdf8';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(0, 242, 254, 0.1)',
            border: '1px solid rgba(0, 242, 254, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe size={18} color="#00f2fe" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              GLOBAL THREAT VECTOR & ATTACK TRAJECTORY RADAR
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              LIVE GEOLOCATED THREAT TELEMETRY & ATTACK ARCS
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff3366' }} />
            <span style={{ color: 'var(--text-secondary)' }}>CRITICAL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff9900' }} />
            <span style={{ color: 'var(--text-secondary)' }}>HIGH</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00f2fe' }} />
            <span style={{ color: 'var(--text-secondary)' }}>DEFENSE TARGET</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map Area */}
      <div style={{
        position: 'relative',
        background: '#070c18',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden'
      }}>
        {/* Subtle grid backdrop */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0, 242, 254, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.7,
          pointerEvents: 'none'
        }} />

        {/* SVG World Map & Vector Paths */}
        <svg 
          viewBox="0 0 900 450" 
          style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '420px' }}
        >
          <defs>
            {/* Pulsing glow filter */}
            <filter id="glow-laser" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            {/* Radar scan linear gradient */}
            <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0, 242, 254, 0.3)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          {/* Continents */}
          {continents.map((d, idx) => (
            <path
              key={idx}
              d={d}
              fill="#0e172a"
              stroke="rgba(0, 242, 254, 0.18)"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
          ))}

          {/* Equator & Meridian Grid */}
          <line x1="0" y1="225" x2="900" y2="225" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" />
          <line x1="450" y1="0" x2="450" y2="450" stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" />

          {/* Animated Attack Arcs & Trajectories */}
          {geoThreats.map((threat, index) => {
            const origin = project(threat.source_lat, threat.source_lng);
            const target = project(threat.target_lat, threat.target_lng);
            const color = getThreatColor(threat.severity);

            // Compute control point for curved arc
            const dx = target.x - origin.x;
            const dy = target.y - origin.y;
            const midX = (origin.x + target.x) / 2;
            const midY = Math.min(origin.y, target.y) - Math.abs(dx) * 0.25;

            const pathD = `M ${origin.x} ${origin.y} Q ${midX} ${midY} ${target.x} ${target.y}`;

            return (
              <g key={threat.id || index} onClick={() => setSelectedThreat(threat)} style={{ cursor: 'pointer' }}>
                {/* Background Shadow Arc */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeOpacity="0.15"
                />

                {/* Animated Laser Arc */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.8"
                  strokeDasharray="8 6"
                  filter="url(#glow-laser)"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="100"
                    to="0"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Attacker Origin Pulse Node */}
                <circle cx={origin.x} cy={origin.y} r="4" fill={color}>
                  <animate
                    attributeName="r"
                    values="3;6;3"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx={origin.x} cy={origin.y} r="10" fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.4">
                  <animate
                    attributeName="r"
                    values="5;14;5"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Origin Label */}
                <text
                  x={origin.x + 8}
                  y={origin.y - 4}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                >
                  {threat.source_city} ({threat.source_country_code})
                </text>

                {/* Target Node */}
                <circle cx={target.x} cy={target.y} r="4" fill="#00f2fe" />
                <circle cx={target.x} cy={target.y} r="10" fill="none" stroke="#00f2fe" strokeWidth="1" strokeOpacity="0.6">
                  <animate
                    attributeName="r"
                    values="6;16;6"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}
        </svg>

        {/* Selected Threat Floating HUD */}
        {selectedThreat && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            width: '320px',
            background: 'rgba(13, 20, 36, 0.95)',
            border: `1px solid ${getThreatColor(selectedThreat.severity)}`,
            borderRadius: '8px',
            padding: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: getThreatColor(selectedThreat.severity), fontWeight: 700 }}>
                {selectedThreat.attack_type}
              </span>
              <button
                onClick={() => setSelectedThreat(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            </div>
            <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong style={{ color: '#f0f4fc' }}>Origin:</strong> {selectedThreat.source_city}, {selectedThreat.source_country} ({selectedThreat.source_ip})</div>
              <div><strong style={{ color: '#f0f4fc' }}>Target:</strong> {selectedThreat.target_label} ({selectedThreat.target_ip})</div>
              <div><strong style={{ color: '#f0f4fc' }}>Coordinates:</strong> {selectedThreat.source_lat.toFixed(2)}°, {selectedThreat.source_lng.toFixed(2)}°</div>
              <div><strong style={{ color: '#f0f4fc' }}>Time:</strong> {selectedThreat.timestamp}</div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Geo Attack Stream Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          RECENT DETECTED ATTACK TRAJECTORIES
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '10px'
        }}>
          {geoThreats.slice(-3).reverse().map((threat, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedThreat(threat)}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f0f4fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crosshair size={13} color={getThreatColor(threat.severity)} />
                  <span>{threat.source_city}, {threat.source_country_code}</span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ color: '#00f2fe' }}>{threat.target_label}</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {threat.attack_type} · {threat.source_ip}
                </div>
              </div>
              <span className={`badge badge-${threat.severity?.toLowerCase() || 'medium'}`}>
                {threat.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
