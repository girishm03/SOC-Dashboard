import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, ShieldCheck, Globe, Hash, 
  Terminal, ExternalLink, AlertOctagon, User, BookOpen
} from 'lucide-react';
import { lookupThreatIntel, fetchCves, fetchActors } from '../services/api';

export default function ThreatIntelSearch({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cves, setCves] = useState([]);
  const [actors, setActors] = useState([]);
  const [activeTab, setActiveTab] = useState('lookup'); // 'lookup', 'cves', 'actors'

  useEffect(() => {
    async function loadData() {
      try {
        const [cvesData, actorsData] = await Promise.all([fetchCves(), fetchActors()]);
        setCves(cvesData);
        setActors(actorsData);
      } catch (err) {
        console.error("Failed to load intel:", err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchTerm) => {
    const q = (searchTerm || query).trim();
    if (!q) return;
    try {
      setLoading(true);
      const data = await lookupThreatIntel(q);
      setResult(data);
      setActiveTab('lookup');
    } catch (err) {
      alert(`Lookup failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sampleQueries = [
    { label: "Cobalt Strike IP", value: "194.26.29.112" },
    { label: "Mimikatz Hash", value: "d2d8c3e8092f694e9f75a74e54f9a0d8ad755a5b6c31f41d911b6973e8e2e2a1" },
    { label: "MOVEit RCE (CVE)", value: "CVE-2023-34362" },
    { label: "LockBit 3.0 Hash", value: "4a2f8b5c901e23d4f56789abcdef0123456789abcdef0123456789abcdef0123" },
    { label: "C2 Domain", value: "c2-sync-analytics.online" },
    { label: "PAN-OS RCE", value: "CVE-2024-3400" }
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return '#ff3366';
    if (score >= 50) return '#ff9900';
    if (score >= 25) return '#eab308';
    return '#10b981';
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Search size={18} color="#8b5cf6" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              THREAT INTELLIGENCE & IOC LOOKUP
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              QUERY IPS, DOMAINS, FILE HASHES (SHA-256), CVES & ADVERSARIES
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('lookup')}
            className={`btn ${activeTab === 'lookup' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            IOC Scanner
          </button>
          <button
            onClick={() => setActiveTab('cves')}
            className={`btn ${activeTab === 'cves' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            CVE Database ({cves.length})
          </button>
          <button
            onClick={() => setActiveTab('actors')}
            className={`btn ${activeTab === 'actors' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          >
            Threat Actors ({actors.length})
          </button>
        </div>
      </div>

      {activeTab === 'lookup' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Search Box */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#090d18',
              border: '1px solid var(--border-glow)',
              borderRadius: '8px',
              padding: '8px 14px',
              gap: '10px'
            }}>
              <Search size={18} color="#00f2fe" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter IP (e.g. 194.26.29.112), SHA256 Hash, Domain, or CVE ID..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#f0f4fc',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none'
                }}
              />
            </div>
            <button 
              disabled={loading}
              onClick={() => handleSearch()} 
              className="btn btn-primary"
            >
              {loading ? 'Querying Intel...' : 'Scan Indicator'}
            </button>
          </div>

          {/* Quick-try presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              QUICK SAMPLES:
            </span>
            {sampleQueries.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(sample.value);
                  handleSearch(sample.value);
                }}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '11px', padding: '3px 8px' }}
              >
                {sample.label}
              </button>
            ))}
          </div>

          {/* Result Card */}
          {result && (
            <div style={{
              background: '#0c1222',
              border: `1px solid ${getScoreColor(result.threat_score)}`,
              borderRadius: '10px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: `0 0 25px ${getScoreColor(result.threat_score)}25`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-low" style={{ fontSize: '10px' }}>
                      {result.type?.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f0f4fc' }}>
                      {result.indicator}
                    </h3>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {result.category}
                  </p>
                </div>

                {/* Threat Score Dial */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>THREAT SCORE</div>
                    <div style={{ fontSize: '11px', color: getScoreColor(result.threat_score), fontWeight: 700 }}>
                      {result.threat_score >= 80 ? 'CRITICAL RISK' : result.threat_score >= 50 ? 'SUSPICIOUS' : 'LOW RISK'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    color: getScoreColor(result.threat_score)
                  }}>
                    {result.threat_score}/100
                  </div>
                </div>
              </div>

              {/* Threat Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '14px',
                borderRadius: '6px'
              }}>
                {result.actor && (
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ATTRIBUTED ACTOR</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff4d79' }}>{result.actor}</div>
                  </div>
                )}
                {result.country && (
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>GEOLOCATION</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4fc' }}>{result.country}</div>
                  </div>
                )}
                {result.asn && (
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ASN ROUTING</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#00f2fe' }}>{result.asn}</div>
                  </div>
                )}
                {result.file_name && (
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>FILE NAME / TYPE</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4fc' }}>{result.file_name}</div>
                  </div>
                )}
                {result.last_seen && (
                  <div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>OBSERVED</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{result.last_seen}</div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {result.tags && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      style={{
                        background: 'rgba(0, 242, 254, 0.1)',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        color: '#00f2fe',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)'
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* CVE extra details if applicable */}
              {result.details && result.type === 'cve' && (
                <div style={{
                  background: 'rgba(255, 51, 102, 0.08)',
                  border: '1px solid rgba(255, 51, 102, 0.25)',
                  padding: '12px',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ff3366' }}>
                    {result.details.title} (CVSS {result.details.cvss})
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
                    {result.details.description}
                  </div>
                  <div style={{ fontSize: '11px', color: '#10b981' }}>
                    <strong>RECOMMENDED MITIGATION:</strong> {result.details.mitigation}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CVE Database Tab */}
      {activeTab === 'cves' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cves.map((cve) => (
            <div 
              key={cve.id}
              style={{
                background: 'rgba(11, 16, 30, 0.75)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-critical">{cve.severity}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#00f2fe' }}>
                    {cve.id}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#f0f4fc' }}>
                    {cve.title}
                  </span>
                </div>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: '#ff3366'
                }}>
                  CVSS {cve.cvss}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                {cve.description}
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                fontSize: '11px', 
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-secondary)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '6px'
              }}>
                <span>AFFECTED: {cve.affected}</span>
                <span style={{ color: '#10b981' }}>MITIGATION: {cve.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Threat Actors Tab */}
      {activeTab === 'actors' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '14px'
        }}>
          {actors.map((actor, idx) => (
            <div 
              key={idx}
              style={{
                background: 'rgba(11, 16, 30, 0.75)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#ff3366' }}>
                  {actor.name}
                </h4>
                <span className="badge badge-high" style={{ fontSize: '10px' }}>
                  CONFIDENCE: {actor.confidence}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>ORIGIN:</strong> {actor.origin}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>TARGETED INDUSTRIES:</strong> {actor.targets}
              </div>
              <div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>PRIMARY TECHNIQUES</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                  {actor.techniques?.map((t, i) => (
                    <span key={i} className="badge badge-medium" style={{ fontSize: '9.5px' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
