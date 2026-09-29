import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, Play, Pause, Search, Filter, 
  Download, Trash2, ArrowDownCircle, ArrowDown
} from 'lucide-react';

export default function LiveLogStreamer({ logs = [] }) {
  // Streaming turned OFF by default when project starts / opens
  const [isStreaming, setIsStreaming] = useState(false);
  // Auto-scroll turned OFF by default
  const [autoScroll, setAutoScroll] = useState(false);

  // Local displayed logs snapshot to prevent disruption while paused
  const [displayedLogs, setDisplayedLogs] = useState(logs);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const logEndRef = useRef(null);
  const terminalRef = useRef(null);

  // Sync logs when streaming is active or on initial load
  useEffect(() => {
    if (isStreaming) {
      setDisplayedLogs(logs || []);
    } else if (displayedLogs.length === 0 && logs && logs.length > 0) {
      setDisplayedLogs(logs);
    }
  }, [logs, isStreaming]);

  // Execute auto-scroll ONLY if explicitly turned ON and streaming is active
  useEffect(() => {
    if (autoScroll && isStreaming && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedLogs, autoScroll, isStreaming]);

  // User turns streaming ON/OFF
  const handleToggleStreaming = () => {
    if (!isStreaming) {
      // When turning ON: update logs, enable stream, but keep auto-scroll OFF as requested
      setDisplayedLogs(logs || []);
      setIsStreaming(true);
      setAutoScroll(false);
    } else {
      setIsStreaming(false);
    }
  };

  // Jump to newest log on demand
  const scrollToBottom = () => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If user scrolls up manually, disable autoScroll so it doesn't fight the user
  const handleTerminalScroll = () => {
    if (!terminalRef.current || !autoScroll) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (!isAtBottom) {
      setAutoScroll(false);
    }
  };

  const filteredLogs = displayedLogs.filter(log => {
    if (severityFilter !== 'all' && log.level.toLowerCase() !== severityFilter.toLowerCase()) return false;
    if (sourceFilter !== 'all' && log.source.toLowerCase() !== sourceFilter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = log.message.toLowerCase().includes(q) ||
                    log.host.toLowerCase().includes(q) ||
                    log.source.toLowerCase().includes(q) ||
                    (log.user && log.user.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const getLevelColor = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL': return '#ff3366';
      case 'ERROR': return '#ff9900';
      case 'WARN': return '#eab308';
      case 'INFO': return '#00f2fe';
      default: return '#94a3b8';
    }
  };

  const exportLogsAsJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `soc_siem_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const pendingCount = Math.max(0, (logs?.length || 0) - displayedLogs.length);

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', height: '620px' }}>
      {/* Header and Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: isStreaming ? 'rgba(0, 242, 254, 0.1)' : 'rgba(234, 179, 8, 0.1)',
            border: `1px solid ${isStreaming ? 'rgba(0, 242, 254, 0.3)' : 'rgba(234, 179, 8, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Terminal size={18} color={isStreaming ? '#00f2fe' : '#eab308'} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: '0.5px' }}>
              REAL-TIME SIEM LOG & TELEMETRY STREAM
            </h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              LIVE BUFFER: {filteredLogs.length} EVENTS ·{' '}
              <span style={{ color: isStreaming ? 'var(--accent-cyan)' : '#eab308', fontWeight: 600 }}>
                {isStreaming ? 'STREAM ACTIVE' : 'STREAM PAUSED'}
              </span>
              {!isStreaming && pendingCount > 0 && (
                <span style={{ color: '#38bdf8', marginLeft: '6px' }}>
                  (+{pendingCount} incoming)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons & Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '4px 10px',
            gap: '6px'
          }}>
            <Search size={13} color="#64748b" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword, IP..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f0f4fc',
                fontSize: '12px',
                outline: 'none',
                width: '130px'
              }}
            />
          </div>

          {/* Level Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#f0f4fc',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          >
            <option value="all">Level: ALL</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="ERROR">ERROR</option>
            <option value="WARN">WARN</option>
            <option value="INFO">INFO</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#f0f4fc',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              outline: 'none'
            }}
          >
            <option value="all">Source: ALL</option>
            <option value="Sysmon">Sysmon</option>
            <option value="Suricata-NIDS">Suricata-NIDS</option>
            <option value="Zeek-DNS">Zeek-DNS</option>
            <option value="EDR-CrowdStrike">EDR-CrowdStrike</option>
            <option value="WAF">WAF</option>
            <option value="Auth-Service">Auth-Service</option>
          </select>

          {/* Stream Toggle (OFF by default) */}
          <button 
            onClick={handleToggleStreaming}
            className={`btn ${isStreaming ? 'btn-primary' : 'btn-outline'} btn-sm`}
            style={{
              borderColor: isStreaming ? undefined : 'rgba(234, 179, 8, 0.5)',
              color: isStreaming ? undefined : '#eab308'
            }}
            title={isStreaming ? "Pause Stream" : "Resume / Turn On Stream"}
          >
            {isStreaming ? <Pause size={13} /> : <Play size={13} />}
            <span>{isStreaming ? 'Streaming' : 'Paused'}</span>
          </button>

          {/* Auto-Scroll Toggle (OFF by default) */}
          <button 
            onClick={() => setAutoScroll(prev => !prev)}
            className={`btn ${autoScroll ? 'btn-primary' : 'btn-outline'} btn-sm`}
            title={autoScroll ? "Disable Auto-scroll" : "Enable Auto-scroll"}
          >
            <ArrowDownCircle size={13} />
            <span>Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}</span>
          </button>

          {/* Jump to bottom */}
          <button 
            onClick={scrollToBottom}
            className="btn btn-outline btn-sm"
            title="Scroll to latest event at bottom"
          >
            <ArrowDown size={13} />
            <span>Bottom</span>
          </button>

          {/* Export JSON */}
          <button 
            onClick={exportLogsAsJson}
            className="btn btn-outline btn-sm"
            title="Export filtered logs as JSON"
          >
            <Download size={13} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Terminal Display Console */}
      <div 
        ref={terminalRef}
        onScroll={handleTerminalScroll}
        style={{
          flex: 1,
          minHeight: 0,
          background: '#060912',
          border: '1px solid rgba(0, 242, 254, 0.15)',
          borderRadius: '8px',
          padding: '14px 16px',
          overflowY: 'auto',
          overflowX: 'hidden',
          fontFamily: 'var(--font-mono)',
          fontSize: '11.5px',
          lineHeight: '1.6',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.8)'
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '40px' }}>
            No log events matching filters.
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div 
              key={log.id || idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '3px 6px',
                borderRadius: '4px',
                transition: 'background 0.1s ease',
                background: log.level === 'CRITICAL' ? 'rgba(255, 51, 102, 0.08)' : 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = log.level === 'CRITICAL' ? 'rgba(255, 51, 102, 0.08)' : 'transparent';
              }}
            >
              {/* Timestamp */}
              <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                [{log.timestamp.split(' ')[1] || log.timestamp}]
              </span>

              {/* Severity Pill */}
              <span style={{
                color: getLevelColor(log.level),
                fontWeight: 700,
                width: '60px',
                flexShrink: 0
              }}>
                {log.level}
              </span>

              {/* Source Sensor */}
              <span style={{
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                padding: '1px 6px',
                borderRadius: '3px',
                fontSize: '10px',
                flexShrink: 0
              }}>
                {log.source}
              </span>

              {/* Host */}
              <span style={{ color: '#a78bfa', flexShrink: 0 }}>
                @{log.host}
              </span>

              {/* Message */}
              <span style={{ color: log.level === 'CRITICAL' ? '#ff4d79' : '#e2e8f0', wordBreak: 'break-all' }}>
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

