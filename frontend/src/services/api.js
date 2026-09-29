const API_BASE = import.meta.env.VITE_API_BASE || "";

function getWsUrl() {
  if (import.meta.env.VITE_WS_BASE) {
    return import.meta.env.VITE_WS_BASE;
  }
  if (typeof window !== "undefined") {
    // If running on local Vite dev server port 5173, point to backend 8000
    if (window.location.port === "5173" || window.location.hostname === "localhost") {
      return "ws://localhost:8000/ws/live";
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws/live`;
  }
  return "ws://localhost:8000/ws/live";
}

const WS_BASE = getWsUrl();

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchIncidents(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/incidents?${query}`);
  if (!res.ok) throw new Error("Failed to fetch incidents");
  return res.json();
}

export async function fetchIncident(id) {
  const res = await fetch(`${API_BASE}/api/incidents/${id}`);
  if (!res.ok) throw new Error("Failed to fetch incident details");
  return res.json();
}

export async function executeIncidentAction(id, action, analystName = "SOC Lead", notes = "") {
  const res = await fetch(`${API_BASE}/api/incidents/${id}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, analyst_name: analystName, notes })
  });
  if (!res.ok) throw new Error("Failed to execute action");
  return res.json();
}

export async function fetchEndpoints() {
  const res = await fetch(`${API_BASE}/api/endpoints`);
  if (!res.ok) throw new Error("Failed to fetch endpoints");
  return res.json();
}

export async function toggleIsolateEndpoint(hostId) {
  const res = await fetch(`${API_BASE}/api/endpoints/${hostId}/isolate`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to toggle isolation");
  return res.json();
}

export async function fetchLogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/logs?${query}`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function lookupThreatIntel(query) {
  const res = await fetch(`${API_BASE}/api/threat-intel/lookup?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to lookup threat intel");
  return res.json();
}

export async function fetchMitreMatrix() {
  const res = await fetch(`${API_BASE}/api/threat-intel/mitre`);
  if (!res.ok) throw new Error("Failed to fetch MITRE matrix");
  return res.json();
}

export async function fetchCves() {
  const res = await fetch(`${API_BASE}/api/threat-intel/cves`);
  if (!res.ok) throw new Error("Failed to fetch CVEs");
  return res.json();
}

export async function fetchActors() {
  const res = await fetch(`${API_BASE}/api/threat-intel/actors`);
  if (!res.ok) throw new Error("Failed to fetch Threat Actors");
  return res.json();
}

export async function triggerAttackSimulation(scenario, targetHost = null) {
  const res = await fetch(`${API_BASE}/api/simulation/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario, target_host: targetHost })
  });
  if (!res.ok) throw new Error("Failed to trigger simulation");
  return res.json();
}

export async function fetchFirewallRules() {
  const res = await fetch(`${API_BASE}/api/firewall/rules`);
  if (!res.ok) throw new Error("Failed to fetch firewall rules");
  return res.json();
}

export async function fetchPlaybooks() {
  const res = await fetch(`${API_BASE}/api/playbooks`);
  if (!res.ok) throw new Error("Failed to fetch playbooks");
  return res.json();
}

export async function executePlaybookStep(playbookId, stepId) {
  const res = await fetch(`${API_BASE}/api/playbooks/${playbookId}/execute-step/${stepId}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to execute playbook step");
  return res.json();
}

export async function runVulnerabilityScan(target) {
  const res = await fetch(`${API_BASE}/api/scanner/run?target=${encodeURIComponent(target)}`, {
    method: "POST"
  });
  if (!res.ok) throw new Error("Failed to run vulnerability scan");
  return res.json();
}

export async function deleteFirewallRule(ruleId) {
  const res = await fetch(`${API_BASE}/api/firewall/rules/${ruleId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to remove firewall rule");
  return res.json();
}

export function connectWebSocket(onMessage, onOpen, onClose) {
  let ws = null;
  let retryTimer = null;
  let isClosedManually = false;
  let retryCount = 0;
  const maxRetries = 5;

  function connect() {
    try {
      ws = new WebSocket(WS_BASE);
      
      ws.onopen = () => {
        retryCount = 0;
        if (onOpen) onOpen();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) onMessage(data);
        } catch (e) {
          console.error("Error parsing WebSocket JSON:", e);
        }
      };

      ws.onclose = () => {
        if (onClose) onClose();
        if (!isClosedManually && retryCount < maxRetries) {
          retryCount++;
          retryTimer = setTimeout(connect, Math.min(3000 * retryCount, 15000));
        }
      };

      ws.onerror = (err) => {
        // Silently handle error as onClose will trigger reconnection or fallback
      };
    } catch (err) {
      if (!isClosedManually && retryCount < maxRetries) {
        retryCount++;
        retryTimer = setTimeout(connect, Math.min(3000 * retryCount, 15000));
      }
    }
  }

  connect();

  return () => {
    isClosedManually = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (ws) ws.close();
  };
}
