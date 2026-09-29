import React, { useState } from 'react';
import { 
  Radio, Search, ShieldAlert, ShieldCheck, Cpu, 
  ExternalLink, Play, Lock, AlertTriangle 
} from 'lucide-react';
import { runVulnerabilityScan, toggleIsolateEndpoint } from '../services/api';

export default function PortScanner({ endpoints, onEndpointIsolated }) {
  const [target, setTarget] = useState('10.0.10.84');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [isolating, setIsolating] = useState(false);

  const handleScan = async (targetToScan) => {
    const tgt = targetToScan || target;
    if (!tgt.trim()) return;
    try {
      setScanning(true);
      const res = await runVulnerabilityScan(tgt);
      setScanResult(res);
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleIsolateTarget = async () => {
    if (!scanResult) return;
    try {
      setIsolating(true);
      const res = await toggleIsolateEndpoint(scanResult.target);
      if (onEndpointIsolated) onEndpointIsolated(res.endpoint);
      alert(`Containment activated: Host ${scanResult.target} quarantined.`);
    } catch (err) {
      alert(`Isolation failed: ${err.message}`);
    } finally {
      setIsolating(false);
    }
  };

  const getRiskBadgeClass = (risk) => {
    switch (risk?.toUpperCase()) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MEDIUM': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
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
            <Radio size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              RECON & VULNERABILITY PORT AUDITOR (NMAP / NESSUS)
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SYN STEALTH PROBES · SERVICE BANNER GRAB · EXPLOIT CORRELATION
            </p>
          </div>
        </div>
      </div>

      {/* Input Controls */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        background: 'rgba(10, 15, 29, 0.7)',
        padding: '14px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            TARGET IP OR HOSTNAME
          </label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. 10.0.1.10 or DC01-ROOT.CORP.INTERNAL"
            style={{
              width: '100%',
              background: '#070a14',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#f0f4fc',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ width: '240px' }}>
          <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
            SELECT FROM ASSETS
          </label>
          <select
            onChange={(e) => {
              setTarget(e.target.value);
              handleScan(e.target.value);
            }}
            style={{
              width: '100%',
              background: '#070a14',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#f0f4fc',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          >
            <option value="">-- Choose Asset --</option>
            {endpoints.map((ep) => (
              <option key={ep.id} value={ep.ip}>
                {ep.hostname} ({ep.ip})
              </option>
            ))}
          </select>
        </div>

        <div style={{ alignSelf: 'flex-end' }}>
          <button
            disabled={scanning}
            onClick={() => handleScan()}
            className="btn btn-primary"
            style={{ height: '36px' }}
          >
            <Play size={14} />
            <span>{scanning ? 'Auditing Target...' : 'Execute SYN Scan'}</span>
          </button>
        </div>
      </div>

      {/* Scanning Radar animation state */}
      {scanning && (
        <div style={{
          padding: '30px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(0, 242, 254, 0.03)',
          border: '1px dashed var(--accent-cyan)',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid var(--accent-cyan)',
            borderTopColor: 'transparent',
            display: 'inline-block'
          }} className="radar-spinner" />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)' }}>
            SENDING RAW TCP SYN PACKETS ON 1,000 PORTS... ANALYZING RESPONSES
          </div>
        </div>
      )}

      {/* Scan Results Output */}
      {scanResult && !scanning && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Target Host Overview Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'rgba(10, 15, 29, 0.9)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TARGET SCANNED</span>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {scanResult.target}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Status: {scanResult.status.toUpperCase()} ({scanResult.latency_ms}ms)</div>
            </div>

            <div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>OS FINGERPRINT</span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#00f2fe' }}>
                {scanResult.os_fingerprint}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>VULNERABILITY RISK</span>
              <div>
                <span className={`badge ${getRiskBadgeClass(scanResult.overall_risk)}`} style={{ marginTop: '2px' }}>
                  {scanResult.overall_risk} RISK
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button
                disabled={isolating}
                onClick={handleIsolateTarget}
                className="btn btn-danger btn-sm"
              >
                <Lock size={13} />
                <span>Quarantine Host</span>
              </button>
            </div>
          </div>

          {/* Open Ports & Services Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)'
                }}>
                  <th style={{ padding: '10px 12px' }}>PORT / PROTO</th>
                  <th style={{ padding: '10px 12px' }}>STATE</th>
                  <th style={{ padding: '10px 12px' }}>SERVICE NAME</th>
                  <th style={{ padding: '10px 12px' }}>VERSION / BANNER</th>
                  <th style={{ padding: '10px 12px' }}>DETECTED VULNERABILITIES</th>
                </tr>
              </thead>
              <tbody>
                {scanResult.open_ports.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-cyan)' }}>
                      {p.port}/TCP
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className="badge badge-success" style={{ fontSize: '9px' }}>
                        {p.state}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '12px', color: '#f0f4fc' }}>
                      {p.service}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {p.version}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {p.vulnerabilities.length === 0 ? (
                        <span style={{ fontSize: '11px', color: '#10b981' }}>None detected</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {p.vulnerabilities.map((v, i) => (
                            <span key={i} className="badge badge-critical" style={{ fontSize: '9.5px' }}>
                              {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
