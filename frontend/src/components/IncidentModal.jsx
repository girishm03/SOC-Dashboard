import React, { useState } from 'react';
import { 
  X, AlertTriangle, ShieldCheck, ShieldAlert, Terminal, 
  Cpu, Ban, CheckCircle, UserCheck, Hash, Globe, FileText, ArrowRight
} from 'lucide-react';
import { executeIncidentAction } from '../services/api';

export default function IncidentModal({ 
  incident, 
  onClose, 
  onActionComplete,
  onLookupIoc 
}) {
  const [loading, setLoading] = useState(false);
  const [analystNotes, setAnalystNotes] = useState('');
  const [analystName, setAnalystName] = useState('Senior SOC Analyst');

  if (!incident) return null;

  const handleAction = async (actionType) => {
    try {
      setLoading(true);
      await executeIncidentAction(incident.id, actionType, analystName, analystNotes);
      if (onActionComplete) onActionComplete(incident.id, actionType);
    } catch (err) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      default: return 'badge-low';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`badge ${getSeverityBadgeClass(incident.severity)}`}>
              {incident.severity}
            </span>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#f0f4fc' }}>
                {incident.title}
              </h2>
              <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                INCIDENT ID: {incident.id} · DETECTED: {incident.timestamp}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer',
              padding: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Status & MITRE Banner */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            padding: '14px',
            borderRadius: '8px'
          }}>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>AFFECTED HOST</span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4fc' }}>{incident.affected_host}</div>
              <div style={{ fontSize: '11px', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{incident.dest_ip}</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ATTACKER / SOURCE</span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff4d79', fontFamily: 'var(--font-mono)' }}>{incident.source_ip}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>External Hostile Vector</div>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>MITRE ATT&CK TACTIC</span>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffaa33' }}>{incident.mitre_tactic}</div>
              <div style={{ fontSize: '11px', color: '#ffaa33', fontFamily: 'var(--font-mono)' }}>
                {incident.mitre_technique_id} · {incident.mitre_technique_name}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>TRIAGE STATUS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span className={`badge badge-${incident.status === 'contained' ? 'warning' : incident.status === 'resolved' ? 'success' : 'critical'}`}>
                  {incident.status}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{incident.assigned_to}</span>
              </div>
            </div>
          </div>

          {/* Incident Narrative */}
          <div>
            <h4 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
              INCIDENT NARRATIVE & TELEMETRY SUMMARY
            </h4>
            <div style={{
              background: 'rgba(10, 14, 25, 0.7)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#e2e8f0',
              lineHeight: 1.6
            }}>
              {incident.description}
            </div>
            {incident.detection_rule && (
              <div style={{ marginTop: '8px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                <strong>DETECTION SIGNATURE:</strong> {incident.detection_rule}
              </div>
            )}
          </div>

          {/* Observable IOCs */}
          {incident.iocs && incident.iocs.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                OBSERVABLE INDICATORS OF COMPROMISE (IOCS)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {incident.iocs.map((ioc, idx) => (
                  <div 
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      padding: '8px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-critical" style={{ fontSize: '10px' }}>
                        {ioc.type.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#f0f4fc' }}>
                        {ioc.value}
                      </span>
                      {ioc.details && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          ({ioc.details})
                        </span>
                      )}
                    </div>
                    {onLookupIoc && (
                      <button
                        onClick={() => onLookupIoc(ioc.value)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        Inspect Threat Intel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process Tree Forensic Graph */}
          {incident.process_tree && incident.process_tree.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                FORENSIC PROCESS EXECUTION TREE (EDR)
              </h4>
              <div className="terminal-block">
                {incident.process_tree.map((p, idx) => (
                  <div key={idx} style={{ padding: '3px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {idx === 0 ? "├─" : "│  └─"}
                    </span>
                    <span style={{ color: '#ff3366', fontWeight: 600 }}>PID {p.pid}</span>
                    <span style={{ color: '#00f2fe' }}>{p.name}</span>
                    <span style={{ color: '#64748b' }}>[{p.user}]</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Remediation Audit Trail */}
          {incident.actions_taken && incident.actions_taken.length > 0 && (
            <div>
              <h4 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                INCIDENT RESPONSE AUDIT TRAIL
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {incident.actions_taken.map((act, idx) => (
                  <div key={idx} style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: '#10b981',
                    background: 'rgba(16, 185, 129, 0.08)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.2)'
                  }}>
                    ✓ {act}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyst Notes Input */}
          <div>
            <h4 style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '6px' }}>
              SOC ANALYST NOTES / DISPOSITION
            </h4>
            <input 
              type="text"
              value={analystNotes}
              onChange={(e) => setAnalystNotes(e.target.value)}
              placeholder="e.g. Memory snapshot collected, sandbox analysis confirmed LockBit affiliate..."
              style={{
                width: '100%',
                background: '#090d18',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '10px 14px',
                color: '#f0f4fc',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Modal Action Controls Footer */}
        <div className="modal-footer">
          <button 
            disabled={loading || incident.status === 'contained'}
            onClick={() => handleAction('isolate_host')}
            className="btn btn-danger"
          >
            <ShieldAlert size={14} />
            <span>Isolate Host ({incident.affected_host})</span>
          </button>

          <button 
            disabled={loading}
            onClick={() => handleAction('block_ip')}
            className="btn btn-warning"
          >
            <Ban size={14} />
            <span>Block IP ({incident.source_ip})</span>
          </button>

          <button 
            disabled={loading}
            onClick={() => handleAction('kill_process')}
            className="btn btn-outline"
          >
            <Cpu size={14} />
            <span>Kill Malicious Processes</span>
          </button>

          <button 
            disabled={loading || incident.status === 'resolved'}
            onClick={() => handleAction('resolve')}
            className="btn btn-primary"
          >
            <CheckCircle size={14} />
            <span>Mark Resolved</span>
          </button>
        </div>
      </div>
    </div>
  );
}
