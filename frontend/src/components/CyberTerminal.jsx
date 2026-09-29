import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, CornerDownLeft } from 'lucide-react';
import { 
  fetchStats, toggleIsolateEndpoint, lookupThreatIntel, 
  executeIncidentAction, triggerAttackSimulation, runVulnerabilityScan 
} from '../services/api';

export default function CyberTerminal({ 
  onClose, 
  onThemeChange, 
  onToggleMatrix,
  currentTheme 
}) {
  const [history, setHistory] = useState([
    { type: 'system', text: 'SENTINEL-X CYBER INTERACTIVE SHELL v2.4.0 [x86_64-soc-linux-gnu]' },
    { type: 'system', text: 'Type "help" to list operational commands. Autocomplete: TAB.' },
    { type: 'system', text: 'Session authenticated: root (Superuser / SOC Commander)' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isMaximized, setIsMaximized] = useState(false);
  const terminalEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = async (rawCmd) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    setCmdHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);

    const newHistory = [...history, { type: 'input', text: `root@sentinel-x:~# ${trimmed}` }];
    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').trim();

    switch (cmd) {
      case 'help':
        newHistory.push({
          type: 'output',
          text: `AVAILABLE CYBER COMMANDS:
  help                     - Display this command index
  stats                    - View active SOC operational telemetry & DEFCON
  scan <ip/host>           - Run remote Nmap port & vulnerability auditor
  isolate <host/ip>        - Zero-Trust EDR quarantine on host
  release <host/ip>        - Remove host network isolation
  block <ip>               - Add perimeter firewall drop rule
  lookup <ioc/cve/hash>    - Query threat intelligence database
  simulate <attack_type>   - Trigger Red Team attack [ransomware|lateral|dns|c2]
  theme <name>             - Switch theme [matrix | cyber | blood | amber]
  matrix                   - Toggle Matrix digital rain background
  clear                    - Clear terminal console screen
  whoami                   - Print active session user credentials
  exit                     - Close interactive cyber terminal`
        });
        break;

      case 'stats':
        try {
          const stats = await fetchStats();
          newHistory.push({
            type: 'output',
            text: `[SOC TELEMETRY REPORT]
  DEFCON Status:       ${stats.defcon_status}
  Active Incidents:    ${stats.active_incidents} (${stats.critical_alerts} Critical / ${stats.high_alerts} High)
  Ingestion Velocity:  ${stats.current_eps} EPS
  Blocked Attacks 24h: ${stats.blocked_attacks_today}
  MTTD / MTTR:         ${stats.mttd_minutes}m / ${stats.mttr_minutes}m
  Endpoints:           ${stats.total_endpoints} Total (${stats.compromised_endpoints} Compromised, ${stats.isolated_endpoints} Isolated)`
          });
        } catch (e) {
          newHistory.push({ type: 'error', text: `Failed to fetch stats: ${e.message}` });
        }
        break;

      case 'scan':
        if (!arg) {
          newHistory.push({ type: 'error', text: 'Usage: scan <ip_or_hostname> (e.g. scan 10.0.1.10)' });
          break;
        }
        newHistory.push({ type: 'info', text: `[!] Initializing SYN Stealth Scan on ${arg}...` });
        try {
          const res = await runVulnerabilityScan(arg);
          const portLines = res.open_ports.map(p => 
            `  ${p.port}/TCP \t${p.state.toUpperCase()} \t${p.service} \t(${p.version}) ${p.vulnerabilities.length > 0 ? '--> VULN: ' + p.vulnerabilities.join(', ') : ''}`
          ).join('\n');
          newHistory.push({
            type: 'output',
            text: `Nmap scan report for ${res.target} (Latency: ${res.latency_ms}ms)
OS Fingerprint: ${res.os_fingerprint}
Overall Host Risk: ${res.overall_risk}
PORT      STATE   SERVICE       VERSION
${portLines}

Nmap done: 1 IP address (1 host up) scanned.`
          });
        } catch (e) {
          newHistory.push({ type: 'error', text: `Scan error: ${e.message}` });
        }
        break;

      case 'isolate':
        if (!arg) {
          newHistory.push({ type: 'error', text: 'Usage: isolate <hostname_or_id> (e.g. isolate WS-FINANCE-04)' });
          break;
        }
        try {
          const res = await toggleIsolateEndpoint(arg);
          newHistory.push({ type: 'success', text: `[+] ZERO-TRUST CONTAINMENT: Host ${arg} has been isolated via EDR rule.` });
        } catch (e) {
          newHistory.push({ type: 'error', text: `Isolation error: ${e.message}` });
        }
        break;

      case 'release':
        if (!arg) {
          newHistory.push({ type: 'error', text: 'Usage: release <hostname_or_id>' });
          break;
        }
        try {
          const res = await toggleIsolateEndpoint(arg);
          newHistory.push({ type: 'success', text: `[+] Host ${arg} released from quarantine.` });
        } catch (e) {
          newHistory.push({ type: 'error', text: `Release error: ${e.message}` });
        }
        break;

      case 'lookup':
        if (!arg) {
          newHistory.push({ type: 'error', text: 'Usage: lookup <ip/domain/hash/cve> (e.g. lookup 194.26.29.112)' });
          break;
        }
        try {
          const res = await lookupThreatIntel(arg);
          newHistory.push({
            type: 'output',
            text: `[THREAT INTEL DOSSIER]
  Indicator:    ${res.indicator} (${res.type?.toUpperCase()})
  Threat Score: ${res.threat_score}/100
  Category:     ${res.category}
  Actor:        ${res.actor || 'N/A'}
  Location:     ${res.country || 'N/A'}
  Tags:         ${res.tags?.join(', ') || 'none'}`
          });
        } catch (e) {
          newHistory.push({ type: 'error', text: `Lookup error: ${e.message}` });
        }
        break;

      case 'simulate':
        const validSims = ['ransomware', 'lateral_movement', 'dns_exfiltration', 'c2_beaconing'];
        const chosen = arg.toLowerCase() || 'ransomware';
        if (!validSims.includes(chosen)) {
          newHistory.push({ type: 'error', text: `Invalid scenario. Choose from: ${validSims.join(', ')}` });
          break;
        }
        try {
          newHistory.push({ type: 'info', text: `[!] Launching Red Team ${chosen} scenario payload...` });
          const res = await triggerAttackSimulation(chosen);
          newHistory.push({
            type: 'success',
            text: `[+] DETECTED: Incident ${res.incident.id} generated (${res.incident.title}). DEFCON updated.`
          });
        } catch (e) {
          newHistory.push({ type: 'error', text: `Simulation error: ${e.message}` });
        }
        break;

      case 'theme':
        if (['matrix', 'cyber', 'blood', 'amber'].includes(arg.toLowerCase())) {
          if (onThemeChange) onThemeChange(arg.toLowerCase());
          newHistory.push({ type: 'success', text: `[+] UI Theme switched to: ${arg.toUpperCase()}` });
        } else {
          newHistory.push({ type: 'error', text: 'Available themes: matrix, cyber, blood, amber' });
        }
        break;

      case 'matrix':
        if (onToggleMatrix) onToggleMatrix();
        newHistory.push({ type: 'success', text: '[+] Toggled Matrix Digital Rain background.' });
        break;

      case 'clear':
        setHistory([]);
        setInputVal('');
        return;

      case 'whoami':
        newHistory.push({ type: 'output', text: 'uid=0(root) gid=0(root) groups=0(root),27(sudo),1000(soc_analyst)' });
        break;

      case 'exit':
        onClose();
        return;

      default:
        newHistory.push({
          type: 'error',
          text: `bash: ${cmd}: command not found. Type "help" for active commands.`
        });
        break;
    }

    setHistory(newHistory);
    setInputVal('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const nextIdx = historyIndex + 1 < cmdHistory.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[cmdHistory.length - 1 - nextIdx] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(cmdHistory[cmdHistory.length - 1 - nextIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple autocompletion
      const cmds = ['help', 'stats', 'scan', 'isolate', 'release', 'block', 'lookup', 'simulate', 'theme', 'matrix', 'clear'];
      const match = cmds.find(c => c.startsWith(inputVal.trim()));
      if (match) setInputVal(match + ' ');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-box" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: isMaximized ? '96vw' : '820px',
          height: isMaximized ? '90vh' : '520px',
          maxHeight: '94vh',
          background: 'rgba(5, 8, 15, 0.96)',
          border: '1px solid var(--accent-cyan)',
          boxShadow: '0 0 35px rgba(0, 242, 254, 0.3)',
          transition: 'all 0.2s ease-out'
        }}
      >
        {/* Terminal Titlebar */}
        <div style={{
          padding: '10px 16px',
          background: 'rgba(10, 15, 28, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TerminalIcon size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              root@sentinel-x: /var/log/soc [bash]
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              title={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              title="Close Terminal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Terminal Screen Area */}
        <div 
          onClick={() => inputRef.current?.focus()}
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            cursor: 'text'
          }}
        >
          {history.map((line, idx) => {
            let textColor = 'var(--text-secondary)';
            if (line.type === 'input') textColor = 'var(--accent-cyan)';
            if (line.type === 'error') textColor = '#ff3366';
            if (line.type === 'success') textColor = '#10b981';
            if (line.type === 'info') textColor = '#ffaa33';
            if (line.type === 'system') textColor = '#64748b';

            return (
              <div key={idx} style={{ color: textColor, whiteSpace: 'pre-wrap' }}>
                {line.text}
              </div>
            );
          })}

          {/* Active Input Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              root@sentinel-x:~#
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck="false"
              autoComplete="off"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f0f4fc',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px'
              }}
            />
          </div>
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
