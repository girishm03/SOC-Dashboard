import React, { useState, useEffect } from 'react';
import { Flame, Shield, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { fetchMitreMatrix } from '../services/api';

export default function MitreMatrix() {
  const [tactics, setTactics] = useState([]);
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMitreMatrix();
        setTactics(data);
      } catch (err) {
        console.error("Failed to load MITRE:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getSeverityBadgeClass = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'badge-critical';
      case 'high': return 'badge-high';
      case 'medium': return 'badge-medium';
      default: return 'badge-low';
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
            background: 'rgba(255, 153, 0, 0.1)',
            border: '1px solid rgba(255, 153, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={18} color="#ff9900" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              MITRE ATT&CK® ENTERPRISE THREAT COVERAGE MATRIX
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              12 TACTICAL PHASES · BEHAVIORAL DETECTION HEATMAP
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading MITRE ATT&CK Matrix...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {tactics.map((tac) => (
            <div
              key={tac.id}
              style={{
                background: 'rgba(11, 16, 30, 0.75)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {/* Tactic Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {tac.id}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4fc' }}>
                    {tac.name}
                  </div>
                </div>
                <span className={`badge ${tac.active_alerts > 10 ? 'badge-critical' : tac.active_alerts > 5 ? 'badge-high' : 'badge-low'}`}>
                  {tac.active_alerts} ALERTS
                </span>
              </div>

              {/* Techniques List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tac.techniques?.map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTechnique({ ...tech, tactic: tac.name })}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '5px',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 242, 254, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#00f2fe' }}>
                        {tech.id}
                      </div>
                      <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 500 }}>
                        {tech.name}
                      </div>
                    </div>
                    <span className={`badge ${getSeverityBadgeClass(tech.severity)}`} style={{ fontSize: '9px' }}>
                      {tech.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Technique Detail Modal */}
      {selectedTechnique && (
        <div className="modal-overlay" onClick={() => setSelectedTechnique(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <div>
                <span className={`badge ${getSeverityBadgeClass(selectedTechnique.severity)}`}>
                  {selectedTechnique.severity}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f0f4fc', marginTop: '6px' }}>
                  {selectedTechnique.id} - {selectedTechnique.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTechnique(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>TACTIC PHASE:</strong> {selectedTechnique.tactic}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>TOTAL DETECTIONS LOGGED:</strong> {selectedTechnique.count} events
              </div>
              <div style={{
                background: '#090d18',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12px',
                color: '#e2e8f0',
                lineHeight: 1.6
              }}>
                This MITRE ATT&CK technique represents adversary tradecraft mapped to active SIEM correlation rules. When telemetry triggers this technique, automated containment playbooks evaluate host isolation and firewall perimeter blocking.
              </div>
              <a
                href={`https://attack.mitre.org/techniques/${selectedTechnique.id.replace('.', '/')}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
                style={{ alignSelf: 'flex-start', fontSize: '12px' }}
              >
                <ExternalLink size={14} />
                <span>View on MITRE ATT&CK Official Docs</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
