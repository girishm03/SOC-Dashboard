import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MetricsHeader from './components/MetricsHeader';
import ThreatMap from './components/ThreatMap';
import IncidentList from './components/IncidentList';
import IncidentModal from './components/IncidentModal';
import LiveLogStreamer from './components/LiveLogStreamer';
import EndpointGrid from './components/EndpointGrid';
import MitreMatrix from './components/MitreMatrix';
import ThreatIntelSearch from './components/ThreatIntelSearch';
import FirewallRulesView from './components/FirewallRulesView';
import AttackSimulatorModal from './components/AttackSimulatorModal';
import CyberTerminal from './components/CyberTerminal';
import MatrixRain from './components/MatrixRain';
import PortScanner from './components/PortScanner';
import PlaybooksView from './components/PlaybooksView';

import { 
  fetchStats, fetchIncidents, fetchEndpoints, 
  fetchLogs, fetchFirewallRules, connectWebSocket,
  executeIncidentAction
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [endpoints, setEndpoints] = useState([]);
  const [logs, setLogs] = useState([]);
  const [geoThreats, setGeoThreats] = useState([]);
  const [firewallRules, setFirewallRules] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [threatIntelPreQuery, setThreatIntelPreQuery] = useState('');

  // Hacker Themes & Features State
  const [theme, setTheme] = useState('matrix'); // Default to hacker matrix theme!
  const [matrixRain, setMatrixRain] = useState(true);
  const [crtEnabled, setCrtEnabled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  // Audio synthesizer via Web Audio API for cybersecurity audible alert
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.32);
    } catch (e) {
      console.warn("Audio playback error:", e);
    }
  };

  // Keyboard shortcut: Ctrl+` to toggle interactive CLI terminal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && e.key === '`') || e.key === 'F2') {
        e.preventDefault();
        setTerminalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Connect WebSocket & Initial Data Fetch
  useEffect(() => {
    async function loadInitial() {
      try {
        const [statsData, incData, epData, logsData, fwData] = await Promise.all([
          fetchStats().catch(() => null),
          fetchIncidents().catch(() => []),
          fetchEndpoints().catch(() => []),
          fetchLogs().catch(() => []),
          fetchFirewallRules().catch(() => [])
        ]);
        if (statsData) setStats(statsData);
        if (incData) setIncidents(incData);
        if (epData) setEndpoints(epData);
        if (logsData) setLogs(logsData.reverse());
        if (fwData) setFirewallRules(fwData);
      } catch (err) {
        console.error("Initial load failed:", err);
      }
    }
    loadInitial();

    const cleanupWs = connectWebSocket(
      (msg) => {
        if (msg.type === 'INIT_STATE') {
          setStats(msg.stats);
          setIncidents(msg.incidents || []);
          setEndpoints(msg.endpoints || []);
          setLogs(msg.logs || []);
          setGeoThreats(msg.geo_threats || []);
          setFirewallRules(msg.firewall_rules || []);
        } else if (msg.type === 'TELEMETRY_UPDATE') {
          setStats(msg.stats);
          if (msg.endpoints) setEndpoints(msg.endpoints);
          if (msg.new_log) {
            setLogs(prev => [...prev.slice(-300), msg.new_log]);
          }
        } else if (msg.type === 'NEW_INCIDENT') {
          playAlertSound();
          setIncidents(prev => [msg.incident, ...prev.filter(i => i.id !== msg.incident.id)]);
          if (msg.stats) setStats(msg.stats);
          if (msg.endpoints) setEndpoints(msg.endpoints);
          if (msg.new_log) {
            setLogs(prev => [...prev.slice(-300), msg.new_log]);
          }
        } else if (msg.type === 'INCIDENT_UPDATED') {
          setIncidents(prev => prev.map(i => i.id === msg.incident.id ? msg.incident : i));
          if (msg.stats) setStats(msg.stats);
          if (msg.endpoints) setEndpoints(msg.endpoints);
          if (msg.firewall_rules) setFirewallRules(msg.firewall_rules);
        } else if (msg.type === 'ENDPOINTS_UPDATED') {
          setEndpoints(msg.endpoints);
          if (msg.stats) setStats(msg.stats);
        } else if (msg.type === 'GEO_THREAT') {
          setGeoThreats(prev => [...prev.slice(-30), msg.geo]);
        } else if (msg.type === 'FIREWALL_RULES_UPDATED') {
          setFirewallRules(msg.firewall_rules);
        } else if (msg.type === 'PLAYBOOK_STEP_COMPLETED') {
          if (msg.new_log) {
            setLogs(prev => [...prev.slice(-300), msg.new_log]);
          }
        }
      },
      () => setWsConnected(true),
      () => setWsConnected(false)
    );

    return () => cleanupWs();
  }, [soundEnabled]);

  // Graceful polling fallback when WebSocket is inactive (e.g. Serverless Vercel deployment)
  useEffect(() => {
    if (wsConnected) return;
    const pollInterval = setInterval(async () => {
      try {
        const [statsData, incData, epData, fwData] = await Promise.all([
          fetchStats().catch(() => null),
          fetchIncidents().catch(() => null),
          fetchEndpoints().catch(() => null),
          fetchFirewallRules().catch(() => null)
        ]);
        if (statsData) setStats(statsData);
        if (incData) setIncidents(incData);
        if (epData) setEndpoints(epData);
        if (fwData) setFirewallRules(fwData);
      } catch (err) {
        // Silent catch for background polling
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [wsConnected]);

  const handleQuickIsolate = async (incident) => {
    try {
      await executeIncidentAction(incident.id, 'isolate_host', 'Senior SOC Analyst', 'Quick Isolation');
      setIncidents(prev => prev.map(i => i.id === incident.id ? { ...i, status: 'contained' } : i));
    } catch (err) {
      alert(`Quick isolate failed: ${err.message}`);
    }
  };

  const handleLookupIocFromIncident = (iocValue) => {
    setSelectedIncident(null);
    setThreatIntelPreQuery(iocValue);
    setActiveTab('threat_intel');
  };

  const getThemeColor = () => {
    switch (theme) {
      case 'matrix': return '#00ff66';
      case 'blood': return '#ff0033';
      case 'amber': return '#ffaa00';
      default: return '#00f2fe';
    }
  };

  return (
    <div className={`app-layout theme-${theme}`}>
      {/* CRT Scanline Retro Overlay */}
      {crtEnabled && <div className="crt-overlay" />}

      {/* Matrix Digital Rain Background Canvas */}
      {matrixRain && <MatrixRain color={getThemeColor()} />}

      {/* Sidebar Navigation (with Mobile Drawer support) */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        stats={stats}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenTerminal={() => setTerminalOpen(true)}
      />

      {/* Main Operational View */}
      <div className="main-content">
        <Navbar 
          stats={stats} 
          wsConnected={wsConnected} 
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          onOpenSimModal={() => setIsSimModalOpen(true)}
          onOpenTerminal={() => setTerminalOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          currentTheme={theme}
          onChangeTheme={setTheme}
          matrixRainEnabled={matrixRain}
          onToggleMatrixRain={() => setMatrixRain(prev => !prev)}
          crtEnabled={crtEnabled}
          onToggleCrt={() => setCrtEnabled(prev => !prev)}
        />

        <div className="dashboard-scroll-area">
          {/* Top KPI Header */}
          <MetricsHeader stats={stats} />

          {/* Tab: Overview (Unified Command Center) */}
          {activeTab === 'overview' && (
            <>
              {/* Row 1: Threat Map (Global Radar) & Active Incidents Queue */}
              <div className="grid-two-column">
                <ThreatMap geoThreats={geoThreats} />
                <IncidentList 
                  incidents={incidents.slice(0, 5)} 
                  onSelectIncident={(inc) => setSelectedIncident(inc)}
                  onQuickIsolate={handleQuickIsolate}
                />
              </div>

              {/* Row 2: Live SIEM Console & Monitored Fleet */}
              <div className="grid-two-column">
                <LiveLogStreamer logs={logs} />
                <EndpointGrid 
                  endpoints={endpoints} 
                  onEndpointUpdated={(updated) => {
                    setEndpoints(prev => prev.map(e => e.id === updated.id ? updated : e));
                  }}
                />
              </div>
            </>
          )}

          {/* Tab: Incidents & Triage */}
          {activeTab === 'incidents' && (
            <IncidentList 
              incidents={incidents} 
              onSelectIncident={(inc) => setSelectedIncident(inc)}
              onQuickIsolate={handleQuickIsolate}
            />
          )}

          {/* Tab: Fleet & Endpoints */}
          {activeTab === 'endpoints' && (
            <EndpointGrid 
              endpoints={endpoints} 
              onEndpointUpdated={(updated) => {
                setEndpoints(prev => prev.map(e => e.id === updated.id ? updated : e));
              }}
            />
          )}

          {/* Tab: Port & Vulnerability Auditor */}
          {activeTab === 'scanner' && (
            <PortScanner 
              endpoints={endpoints} 
              onEndpointIsolated={(updated) => {
                setEndpoints(prev => prev.map(e => e.id === updated.id ? updated : e));
              }}
            />
          )}

          {/* Tab: Incident Response Playbooks (SOAR) */}
          {activeTab === 'playbooks' && (
            <PlaybooksView />
          )}

          {/* Tab: Live SIEM Logs */}
          {activeTab === 'logs' && (
            <LiveLogStreamer logs={logs} />
          )}

          {/* Tab: Global Attack Map */}
          {activeTab === 'threat_map' && (
            <ThreatMap geoThreats={geoThreats} />
          )}

          {/* Tab: MITRE ATT&CK Matrix */}
          {activeTab === 'mitre' && (
            <MitreMatrix />
          )}

          {/* Tab: Threat Intelligence & IOC Lookup */}
          {activeTab === 'threat_intel' && (
            <ThreatIntelSearch initialQuery={threatIntelPreQuery} />
          )}

          {/* Tab: Perimeter Firewall Rules */}
          {activeTab === 'firewall' && (
            <FirewallRulesView 
              rules={firewallRules}
              onRuleDeleted={(ruleId) => {
                setFirewallRules(prev => prev.filter(r => r.rule_id !== ruleId));
              }}
            />
          )}
        </div>
      </div>

      {/* Forensic Incident Detail Modal */}
      {selectedIncident && (
        <IncidentModal 
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onLookupIoc={handleLookupIocFromIncident}
          onActionComplete={(incId, action) => {
            setIncidents(prev => prev.map(i => {
              if (i.id === incId) {
                return {
                  ...i,
                  status: action === 'isolate_host' ? 'contained' : action === 'resolve' ? 'resolved' : i.status,
                  actions_taken: [...(i.actions_taken || []), `Action executed: ${action}`]
                };
              }
              return i;
            }));
            setSelectedIncident(null);
          }}
        />
      )}

      {/* Red Team Attack Simulator Modal */}
      {isSimModalOpen && (
        <AttackSimulatorModal 
          endpoints={endpoints}
          onClose={() => setIsSimModalOpen(false)}
          onSimulationTriggered={(newIncident) => {
            setSelectedIncident(newIncident);
          }}
        />
      )}

      {/* Interactive Cyber CLI Shell Modal */}
      {terminalOpen && (
        <CyberTerminal 
          onClose={() => setTerminalOpen(false)}
          onThemeChange={setTheme}
          onToggleMatrix={() => setMatrixRain(prev => !prev)}
          currentTheme={theme}
        />
      )}
    </div>
  );
}
