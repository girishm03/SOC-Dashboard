import React, { useState } from 'react';
import { Skull, X, Zap, ShieldAlert, ArrowRight, Play } from 'lucide-react';
import { triggerAttackSimulation } from '../services/api';

export default function AttackSimulatorModal({ 
  onClose, 
  endpoints, 
  onSimulationTriggered 
}) {
  const [selectedScenario, setSelectedScenario] = useState('ransomware');
  const [selectedTarget, setSelectedTarget] = useState('WS-FINANCE-04');
  const [loading, setLoading] = useState(false);

  const scenarios = [
    {
      id: 'ransomware',
      name: 'LockBit 3.0 Ransomware Outbreak',
      severity: 'CRITICAL',
      color: '#ff3366',
      description: 'Executes ransomware binary, deletes Volume Shadow Copies (vssadmin.exe delete shadows /all /quiet), trips file canary honeypot, and attempts mass encryption.',
      tactic: 'Impact (T1486)',
      defaultTarget: 'WS-FINANCE-04'
    },
    {
      id: 'lateral_movement',
      name: 'Pass-the-Hash & PsExec Lateral Movement',
      severity: 'CRITICAL',
      color: '#ff3366',
      description: 'Dumps LSASS memory with Mimikatz, harvests Domain Admin NTLM hash, and executes remote service over SMB port 445 on the Domain Controller.',
      tactic: 'Lateral Movement (T1021.002)',
      defaultTarget: 'DC01-ROOT.CORP.INTERNAL'
    },
    {
      id: 'dns_exfiltration',
      name: 'Covert High-Entropy DNS Data Exfiltration',
      severity: 'HIGH',
      color: '#ff9900',
      description: 'Tunnels base64-encoded SQL database records through rapid DNS TXT queries to attacker-controlled authoritative nameserver.',
      tactic: 'Exfiltration Over DNS (T1048)',
      defaultTarget: 'K8S-WORKER-US-EAST-02'
    },
    {
      id: 'c2_beaconing',
      name: 'Cobalt Strike HTTPS Malleable C2 Beacon',
      severity: 'CRITICAL',
      color: '#8b5cf6',
      description: 'Establishes encrypted reverse command-and-control session with 45s jitter profile mimicking AWS CloudFront traffic.',
      tactic: 'Command & Control (T1071.001)',
      defaultTarget: 'PROD-DB-PAYMENTS-CLUSTER'
    }
  ];

  const handleLaunch = async () => {
    try {
      setLoading(true);
      const res = await triggerAttackSimulation(selectedScenario, selectedTarget);
      if (onSimulationTriggered) {
        onSimulationTriggered(res.incident);
      }
      onClose();
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 51, 102, 0.15)',
              border: '1px solid rgba(255, 51, 102, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Skull size={18} color="#ff3366" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#f0f4fc' }}>
                RED TEAM ATTACK SIMULATION SANDBOX
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                TEST LIVE DETECTION, CORRELATION & CONTAINMENT PLAYBOOKS
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Scenario Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              CHOOSE ATTACK SCENARIO
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {scenarios.map((sc) => {
                const isSelected = selectedScenario === sc.id;
                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenario(sc.id);
                      setSelectedTarget(sc.defaultTarget);
                    }}
                    style={{
                      background: isSelected ? 'rgba(255, 51, 102, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid',
                      borderColor: isSelected ? '#ff3366' : 'var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge badge-critical" style={{ fontSize: '9.5px', background: `${sc.color}20`, color: sc.color, borderColor: `${sc.color}50` }}>
                          {sc.severity}
                        </span>
                        <strong style={{ fontSize: '13px', color: '#f0f4fc' }}>
                          {sc.name}
                        </strong>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                        {sc.description}
                      </p>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-cyan)', marginTop: '4px' }}>
                        MITRE TACTIC: {sc.tactic}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Asset Selector */}
          <div>
            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              TARGET ASSET / VICTIM ENDPOINT
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              style={{
                width: '100%',
                background: '#090d18',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#f0f4fc',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                outline: 'none'
              }}
            >
              {endpoints.map((ep) => (
                <option key={ep.id} value={ep.hostname}>
                  {ep.hostname} ({ep.ip}) - {ep.role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button 
            disabled={loading}
            onClick={handleLaunch} 
            className="btn btn-danger"
          >
            <Play size={14} />
            <span>{loading ? 'Injecting Attack...' : 'Launch Live Simulation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
