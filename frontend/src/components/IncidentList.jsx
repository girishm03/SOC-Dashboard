import React, { useState } from 'react';
import { 
  AlertTriangle, ShieldAlert, ShieldCheck, Search, Filter, 
  ChevronRight, Ban, Eye, User
} from 'lucide-react';

export default function IncidentList({ 
  incidents, 
  onSelectIncident,
  onQuickIsolate,
  onQuickResolve 
}) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredIncidents = incidents.filter(inc => {
    if (severityFilter !== 'all' && inc.severity.toLowerCase() !== severityFilter) return false;
    if (statusFilter !== 'all' && inc.status.toLowerCase() !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = inc.title.toLowerCase().includes(q) ||
                    inc.id.toLowerCase().includes(q) ||
                    inc.affected_host.toLowerCase().includes(q) ||
                    inc.source_ip.toLowerCase().includes(q) ||
                    inc.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

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
      {/* Title & Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={18} color="#ff3366" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              SECURITY INCIDENTS & ALERT QUEUE
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              TRIAGE, THREAT ENRICHMENT & IMMEDIATE CONTAINMENT
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
          {/* Search bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '4px 10px',
            gap: '6px'
          }}>
            <Search size={14} color="#64748b" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search host, IP, title..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f0f4fc',
                fontSize: '12px',
                outline: 'none',
                width: '160px'
              }}
            />
          </div>

          {/* Severity Select */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#f0f4fc',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          >
            <option value="all">Severity: ALL</option>
            <option value="critical">CRITICAL</option>
            <option value="high">HIGH</option>
            <option value="medium">MEDIUM</option>
            <option value="low">LOW</option>
          </select>

          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#f0f4fc',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          >
            <option value="all">Status: ALL</option>
            <option value="new">NEW</option>
            <option value="investigating">INVESTIGATING</option>
            <option value="contained">CONTAINED</option>
            <option value="resolved">RESOLVED</option>
          </select>
        </div>
      </div>

      {/* Incidents Table / List */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ 
              borderBottom: '1px solid var(--border-color)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)'
            }}>
              <th style={{ padding: '10px 12px' }}>INCIDENT</th>
              <th style={{ padding: '10px 12px' }}>SEVERITY</th>
              <th style={{ padding: '10px 12px' }}>CATEGORY / MITRE</th>
              <th style={{ padding: '10px 12px' }}>TARGET ASSET</th>
              <th style={{ padding: '10px 12px' }}>SOURCE IP</th>
              <th style={{ padding: '10px 12px' }}>STATUS</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredIncidents.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No incidents matching current filter criteria.
                </td>
              </tr>
            ) : (
              filteredIncidents.map((inc) => (
                <tr 
                  key={inc.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Title & Time */}
                  <td 
                    onClick={() => onSelectIncident(inc)}
                    style={{ padding: '12px', maxWidth: '280px' }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4fc' }}>
                      {inc.title}
                    </div>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {inc.id} · {inc.timestamp}
                    </div>
                  </td>

                  {/* Severity */}
                  <td onClick={() => onSelectIncident(inc)} style={{ padding: '12px' }}>
                    <span className={`badge ${getSeverityBadgeClass(inc.severity)}`}>
                      {inc.severity}
                    </span>
                  </td>

                  {/* Category & MITRE */}
                  <td onClick={() => onSelectIncident(inc)} style={{ padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#e2e8f0' }}>{inc.category}</div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#ffaa33' }}>
                      {inc.mitre_technique_id}
                    </div>
                  </td>

                  {/* Target Asset */}
                  <td onClick={() => onSelectIncident(inc)} style={{ padding: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 500 }}>
                      {inc.affected_host}
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {inc.dest_ip}
                    </div>
                  </td>

                  {/* Source IP */}
                  <td onClick={() => onSelectIncident(inc)} style={{ padding: '12px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#ff4d79' }}>
                      {inc.source_ip}
                    </span>
                  </td>

                  {/* Status */}
                  <td onClick={() => onSelectIncident(inc)} style={{ padding: '12px' }}>
                    <span className={`badge badge-${inc.status === 'contained' ? 'warning' : inc.status === 'resolved' ? 'success' : 'critical'}`}>
                      {inc.status}
                    </span>
                  </td>

                  {/* Quick Actions */}
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => onSelectIncident(inc)}
                        className="btn btn-outline btn-sm"
                        title="Investigate Incident"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>

                      {inc.status !== 'contained' && inc.status !== 'resolved' && onQuickIsolate && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickIsolate(inc);
                          }}
                          className="btn btn-danger btn-sm"
                          title="Isolate Target Host"
                        >
                          <ShieldAlert size={13} />
                          <span>Isolate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
