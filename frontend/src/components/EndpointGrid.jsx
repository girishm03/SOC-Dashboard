import React, { useState } from 'react';
import { 
  Server, ShieldAlert, ShieldCheck, Cpu, HardDrive, 
  Wifi, WifiOff, AlertTriangle, RefreshCw, Lock, Unlock
} from 'lucide-react';
import { toggleIsolateEndpoint } from '../services/api';

export default function EndpointGrid({ endpoints, onEndpointUpdated }) {
  const [loadingHost, setLoadingHost] = useState(null);

  const handleToggleIsolate = async (endpoint) => {
    try {
      setLoadingHost(endpoint.id);
      const res = await toggleIsolateEndpoint(endpoint.id);
      if (onEndpointUpdated) {
        onEndpointUpdated(res.endpoint);
      }
    } catch (err) {
      alert(`Isolation update failed: ${err.message}`);
    } finally {
      setLoadingHost(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'compromised':
        return <span className="badge badge-critical animate-pulse-glow">COMPROMISED</span>;
      case 'isolated':
        return <span className="badge badge-warning">QUARANTINED</span>;
      case 'investigating':
        return <span className="badge badge-medium">UNDER INVESTIGATION</span>;
      default:
        return <span className="badge badge-success">HEALTHY</span>;
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
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Server size={18} color="#38bdf8" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              MONITORED FLEET & ENDPOINT DEFENSE (EDR)
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {endpoints.length} ASSETS CONNECTED · ZERO-TRUST ISOLATION CONTROLS
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Endpoints */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {endpoints.map((ep) => {
          const isCompromised = ep.status === 'compromised';
          const isIsolated = ep.status === 'isolated';

          return (
            <div 
              key={ep.id}
              style={{
                background: 'rgba(13, 19, 34, 0.8)',
                border: '1px solid',
                borderColor: isCompromised 
                  ? '#ff3366' 
                  : isIsolated 
                    ? '#ffaa00' 
                    : 'var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: isCompromised ? '0 0 20px rgba(255, 51, 102, 0.25)' : 'none',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Status Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: '#f0f4fc',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {isIsolated ? <WifiOff size={15} color="#ffaa00" /> : <Wifi size={15} color="#10b981" />}
                    <span>{ep.hostname}</span>
                  </div>
                  <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-cyan)', marginTop: '2px' }}>
                    {ep.ip} · {ep.role}
                  </div>
                </div>
                <div>{getStatusBadge(ep.status)}</div>
              </div>

              {/* OS & Agent Info */}
              <div style={{ 
                fontSize: '11px', 
                color: 'var(--text-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span>OS: {ep.os}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{ep.agent_version}</span>
              </div>

              {/* CPU & Memory Mini Gauges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>CPU UTILIZATION</span>
                    <span style={{ color: ep.cpu_usage > 85 ? '#ff3366' : '#00f2fe' }}>{ep.cpu_usage}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${ep.cpu_usage}%`,
                      height: '100%',
                      background: ep.cpu_usage > 85 ? '#ff3366' : 'linear-gradient(90deg, #00f2fe, #3b82f6)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>MEMORY UTILIZATION</span>
                    <span style={{ color: ep.memory_usage > 85 ? '#ff3366' : '#8b5cf6' }}>{ep.memory_usage}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${ep.memory_usage}%`,
                      height: '100%',
                      background: ep.memory_usage > 85 ? '#ff3366' : 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Active Services Pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {ep.services?.map((svc, i) => (
                  <span 
                    key={i}
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {svc}
                  </span>
                ))}
              </div>

              {/* Action Button: Isolate / Un-isolate */}
              <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                <button
                  disabled={loadingHost === ep.id}
                  onClick={() => handleToggleIsolate(ep)}
                  className={`btn ${isIsolated ? 'btn-primary' : 'btn-danger'} btn-sm`}
                  style={{ width: '100%' }}
                >
                  {isIsolated ? <Unlock size={13} /> : <Lock size={13} />}
                  <span>
                    {loadingHost === ep.id 
                      ? 'Executing Command...' 
                      : isIsolated 
                        ? 'Release Network Isolation' 
                        : 'Isolate Endpoint via EDR'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
