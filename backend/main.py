import asyncio
from contextlib import asynccontextmanager
from typing import Optional, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    Incident, IncidentActionRequest, AttackSimulationRequest,
    SystemStats, Endpoint, LogEvent
)
from engine.data_store import store
from engine.simulator import simulator
from engine.threat_intel import (
    lookup_indicator, MITRE_TACTICS, KNOWN_CVES, KNOWN_ACTORS
)

simulation_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch background log simulation & telemetry loop
    task = asyncio.create_task(simulator.start())
    yield
    # Shutdown: Cancel background loop
    simulator.is_running = False
    task.cancel()

app = FastAPI(
    title="SOC Cyber Defense Platform API",
    version="2.4.0",
    description="Enterprise Security Operations Center API with Live SIEM Engine, Threat Intel, and Automated Incident Response",
    lifespan=lifespan
)

# Enable CORS for local Vite dev server and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health():
    return {"status": "operational", "soc_tier": "Enterprise Tier 3", "agents_connected": len(store.endpoints)}

@app.get("/api/stats", response_model=SystemStats)
async def get_stats():
    return store.get_stats()

@app.get("/api/incidents")
async def get_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None
):
    incidents_list = list(store.incidents.values())
    if severity and severity != "all":
        incidents_list = [i for i in incidents_list if i.severity.lower() == severity.lower()]
    if status and status != "all":
        incidents_list = [i for i in incidents_list if i.status.lower() == status.lower()]
    # Sort by timestamp descending
    incidents_list.sort(key=lambda x: x.timestamp, reverse=True)
    return incidents_list

@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    if incident_id not in store.incidents:
        raise HTTPException(status_code=404, detail="Incident not found")
    return store.incidents[incident_id]

@app.post("/api/incidents/{incident_id}/action")
async def perform_incident_action(incident_id: str, req: IncidentActionRequest):
    if incident_id not in store.incidents:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    incident = store.incidents[incident_id]
    action_note = ""

    if req.action == "isolate_host":
        store.isolate_endpoint(incident.affected_host)
        action_note = f"Host '{incident.affected_host}' quarantined by {req.analyst_name}."
        incident.actions_taken.append(action_note)
        incident.status = "contained"

    elif req.action == "block_ip":
        store.block_ip(incident.source_ip, reason=f"Blocked via {incident.id}")
        action_note = f"Source IP {incident.source_ip} blocked on perimeter firewall by {req.analyst_name}."
        incident.actions_taken.append(action_note)

    elif req.action == "kill_process":
        action_note = f"Malicious process tree on {incident.affected_host} terminated by EDR agent."
        incident.actions_taken.append(action_note)
        if incident.status == "new":
            incident.status = "investigating"

    elif req.action == "resolve":
        incident.status = "resolved"
        action_note = f"Incident marked RESOLVED by {req.analyst_name}. Notes: {req.notes or 'Remediation completed.'}"
        incident.actions_taken.append(action_note)
        # If no other critical incidents remain on this host, restore endpoint status
        host_has_active = any(
            i.affected_host == incident.affected_host and i.status != "resolved" and i.id != incident.id
            for i in store.incidents.values()
        )
        if not host_has_active:
            for ep in store.endpoints.values():
                if ep.hostname == incident.affected_host and ep.status != "isolated":
                    ep.status = "healthy"
                    ep.active_threats_count = 0

    elif req.action == "investigate":
        incident.status = "investigating"
        incident.assigned_to = req.analyst_name
        action_note = f"Investigation claimed by {req.analyst_name}."
        incident.actions_taken.append(action_note)

    else:
        raise HTTPException(status_code=400, detail="Invalid action type")

    # Broadcast updated incident and stats
    await simulator.broadcast({
        "type": "INCIDENT_UPDATED",
        "incident": incident.model_dump(),
        "stats": store.get_stats().model_dump(),
        "endpoints": [ep.model_dump() for ep in store.endpoints.values()],
        "firewall_rules": store.firewall_rules
    })

    return {"status": "success", "message": action_note, "incident": incident}

@app.get("/api/endpoints")
async def get_endpoints():
    return list(store.endpoints.values())

@app.post("/api/endpoints/{host_id}/isolate")
async def toggle_isolate_host(host_id: str):
    ep = store.endpoints.get(host_id)
    if not ep:
        # Search by hostname
        for e in store.endpoints.values():
            if e.hostname == host_id:
                ep = e
                break
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    if ep.status == "isolated":
        store.release_endpoint(ep.id)
        msg = f"Host {ep.hostname} unquarantined."
    else:
        store.isolate_endpoint(ep.id)
        msg = f"Host {ep.hostname} quarantined."

    await simulator.broadcast({
        "type": "ENDPOINTS_UPDATED",
        "endpoints": [e.model_dump() for e in store.endpoints.values()],
        "stats": store.get_stats().model_dump()
    })

    return {"status": "success", "message": msg, "endpoint": ep}

@app.get("/api/logs")
async def get_logs(
    limit: int = 100,
    severity: Optional[str] = None,
    source: Optional[str] = None,
    search: Optional[str] = None
):
    all_logs = list(store.logs)
    all_logs.reverse() # newest first

    filtered = []
    for log in all_logs:
        if severity and severity != "all" and log.level.lower() != severity.lower():
            continue
        if source and source != "all" and log.source.lower() != source.lower():
            continue
        if search:
            q = search.lower()
            if q not in log.message.lower() and q not in log.host.lower() and q not in log.source.lower():
                continue
        filtered.append(log)
        if len(filtered) >= limit:
            break

    return filtered

@app.get("/api/threat-intel/lookup")
async def threat_intel_lookup(q: str = Query(..., description="IP, Domain, File Hash, or CVE ID")):
    return lookup_indicator(q)

@app.get("/api/threat-intel/mitre")
async def get_mitre_matrix():
    return MITRE_TACTICS

@app.get("/api/threat-intel/cves")
async def get_cves():
    return list(KNOWN_CVES.values())

@app.get("/api/threat-intel/actors")
async def get_actors():
    return list(KNOWN_ACTORS.values())

@app.get("/api/firewall/rules")
async def get_firewall_rules():
    return store.firewall_rules

@app.delete("/api/firewall/rules/{rule_id}")
async def delete_firewall_rule(rule_id: str):
    initial_len = len(store.firewall_rules)
    store.firewall_rules = [r for r in store.firewall_rules if r.get("rule_id") != rule_id]
    if len(store.firewall_rules) < initial_len:
        await simulator.broadcast({
            "type": "FIREWALL_RULES_UPDATED",
            "firewall_rules": store.firewall_rules
        })
        return {"status": "success", "message": f"Rule {rule_id} removed"}
    raise HTTPException(status_code=404, detail="Rule not found")

PLAYBOOKS_DB = [
    {
        "id": "PB-RANSOM-01",
        "title": "Ransomware Outbreak & Cryptolocker Containment",
        "severity": "CRITICAL",
        "framework": "NIST SP 800-61 Rev. 2",
        "description": "Standard Operating Procedure for handling active ransomware propagation, shadow copy deletion, and canary honeypot trips.",
        "steps": [
            {"id": "step-1", "phase": "Detection", "action": "Identify Patient Zero & Enclave Scope", "completed": True, "automated": True},
            {"id": "step-2", "phase": "Containment", "action": "Trigger Zero-Trust EDR Network Isolation", "completed": False, "automated": True},
            {"id": "step-3", "phase": "Containment", "action": "Block C2 IP & Ransom Note Drop Domains at Border FW", "completed": False, "automated": True},
            {"id": "step-4", "phase": "Eradication", "action": "Kill Malicious Process Tree (vssadmin/powershell/LB3)", "completed": False, "automated": True},
            {"id": "step-5", "phase": "Recovery", "action": "Validate Air-Gapped Immutable Snapshots & Restore Host", "completed": False, "automated": False}
        ]
    },
    {
        "id": "PB-LATERAL-02",
        "title": "Pass-the-Hash & Active Directory Pivot Containment",
        "severity": "CRITICAL",
        "framework": "MITRE D3FEND",
        "description": "Playbook for neutralizing lateral movement via PsExec, WMI, or stolen NTLM Kerberos hashes targeting Domain Controllers.",
        "steps": [
            {"id": "step-1", "phase": "Detection", "action": "Correlate Sysmon Event 10 LSASS Access with Event 7045 Service Creation", "completed": True, "automated": True},
            {"id": "step-2", "phase": "Containment", "action": "Quarantine Pivot Workstation and DC Admin Session", "completed": False, "automated": True},
            {"id": "step-3", "phase": "Eradication", "action": "Terminate PSEXESVC Service and Invalidate TGT Tokens", "completed": False, "automated": True},
            {"id": "step-4", "phase": "Recovery", "action": "Rotate KRBTGT Password Twice to Purge Golden Tickets", "completed": False, "automated": False}
        ]
    },
    {
        "id": "PB-EXFIL-03",
        "title": "DNS Tunneling & Data Exfiltration Interception",
        "severity": "HIGH",
        "framework": "CISA Alert IR",
        "description": "Playbook for stopping covert high-entropy DNS tunnel exfiltration channels.",
        "steps": [
            {"id": "step-1", "phase": "Detection", "action": "Detect Anomalous DNS Query Entropy and Subdomain Length > 50 chars", "completed": True, "automated": True},
            {"id": "step-2", "phase": "Containment", "action": "Sinkhole Rogue Nameserver and Drop Outbound DNS to Unknown IPs", "completed": False, "automated": True},
            {"id": "step-3", "phase": "Containment", "action": "Isolate Exfiltrating Container/Workstation Node", "completed": False, "automated": True},
            {"id": "step-4", "phase": "Assessment", "action": "Calculate Leaked Data Volume and Trigger Compliance Audit", "completed": False, "automated": False}
        ]
    }
]

@app.get("/api/playbooks")
async def get_playbooks():
    return PLAYBOOKS_DB

@app.post("/api/playbooks/{playbook_id}/execute-step/{step_id}")
async def execute_playbook_step(playbook_id: str, step_id: str):
    pb = next((p for p in PLAYBOOKS_DB if p["id"] == playbook_id), None)
    if not pb:
        raise HTTPException(status_code=404, detail="Playbook not found")
    step = next((s for s in pb["steps"] if s["id"] == step_id), None)
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    
    step["completed"] = True
    
    # Broadcast automated action log
    log_ev = LogEvent(
        id=f"LOG-{random.randint(60000, 99999)}",
        timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        level="WARN",
        source="SOAR-Playbook-Engine",
        event_type="PlaybookActionExecuted",
        host="ORCHESTRATOR",
        message=f"PLAYBOOK EXECUTION [{pb['id']}]: '{step['action']}' completed automatically by SOAR."
    )
    store.add_log(log_ev)
    
    await simulator.broadcast({
        "type": "PLAYBOOK_STEP_COMPLETED",
        "playbook_id": playbook_id,
        "step_id": step_id,
        "new_log": log_ev.model_dump()
    })
    
    return {"status": "success", "step": step}

@app.post("/api/scanner/run")
async def run_vulnerability_scan(target: str = Query(..., description="Target IP or Hostname")):
    await asyncio.sleep(1.2) # realistic scan latency simulation
    target_clean = target.strip()
    
    # Check if target matches an endpoint
    matched_ep = next((e for e in store.endpoints.values() if e.hostname.lower() == target_clean.lower() or e.ip == target_clean), None)
    
    if matched_ep:
        if "DC" in matched_ep.hostname:
            ports = [
                {"port": 53, "service": "DNS", "state": "open", "version": "Microsoft Windows DNS 2022", "vulnerabilities": []},
                {"port": 88, "service": "Kerberos", "state": "open", "version": "Active Directory Kerberos KDC", "vulnerabilities": ["CVE-2022-37967"]},
                {"port": 135, "service": "MSRPC", "state": "open", "version": "Microsoft Windows RPC", "vulnerabilities": []},
                {"port": 389, "service": "LDAP", "state": "open", "version": "Active Directory Lightweight Directory Services", "vulnerabilities": []},
                {"port": 445, "service": "Microsoft-DS", "state": "open", "version": "SMBv2/v3", "vulnerabilities": ["CVE-2020-0796 (SMBGhost Patch Verified)"]},
                {"port": 3389, "service": "ms-wbt-server", "state": "filtered", "version": "RDP (Network Level Auth Required)", "vulnerabilities": []}
            ]
            os_guess = "Windows Server 2022 Datacenter (Build 20348)"
            risk = "MEDIUM"
        elif "PAYMENTS" in matched_ep.hostname or "DB" in matched_ep.hostname:
            ports = [
                {"port": 22, "service": "SSH", "state": "open", "version": "OpenSSH 8.7 (RHEL 9)", "vulnerabilities": []},
                {"port": 5432, "service": "PostgreSQL", "state": "open", "version": "PostgreSQL 16.1 Relational DB", "vulnerabilities": ["CVE-2023-34362 (SQLi Hardening Applied)"]},
                {"port": 6379, "service": "Redis", "state": "open", "version": "Redis Cluster 7.0.12 (Auth Required)", "vulnerabilities": []},
                {"port": 8200, "service": "Vault", "state": "open", "version": "HashiCorp Vault 1.15.2 (Transit Engine)", "vulnerabilities": []}
            ]
            os_guess = "Red Hat Enterprise Linux 9.2 (Plow)"
            risk = "HIGH"
        elif "FINANCE" in matched_ep.hostname:
            ports = [
                {"port": 135, "service": "MSRPC", "state": "open", "version": "Microsoft Windows RPC", "vulnerabilities": []},
                {"port": 445, "service": "SMB", "state": "open", "version": "SMBv2 (Workstation File Sharing)", "vulnerabilities": ["Compromised via LockBit/Cobalt Strike"]},
                {"port": 3389, "service": "RDP", "state": "open", "version": "Remote Desktop Protocol 10.0", "vulnerabilities": ["CVE-2024-21413 MonikerLink Exploit Indicator"]},
                {"port": 5040, "service": "EDR-Agent", "state": "open", "version": "CrowdStrike Falcon Sensor 7.14", "vulnerabilities": []}
            ]
            os_guess = "Windows 11 Enterprise (23H2)"
            risk = "CRITICAL"
        else:
            ports = [
                {"port": 80, "service": "HTTP", "state": "open", "version": "Nginx Ingress 1.25.3", "vulnerabilities": []},
                {"port": 443, "service": "HTTPS", "state": "open", "version": "Nginx (TLS 1.3 / Cloudflare WAF)", "vulnerabilities": []},
                {"port": 9100, "service": "Node-Exporter", "state": "open", "version": "Prometheus Metrics Exporter", "vulnerabilities": []}
            ]
            os_guess = "Ubuntu 22.04 LTS (Kernel 5.15.0)"
            risk = "LOW"
    else:
        # External or arbitrary IP scan
        ports = [
            {"port": 22, "service": "SSH", "state": "open", "version": "OpenSSH 7.4 (Outdated Protocol 2.0)", "vulnerabilities": ["CVE-2018-15473 User Enumeration"]},
            {"port": 80, "service": "HTTP", "state": "open", "version": "Apache httpd 2.4.49", "vulnerabilities": ["CVE-2021-41773 Path Traversal & RCE"]},
            {"port": 443, "service": "HTTPS", "state": "open", "version": "OpenSSL 1.0.2k", "vulnerabilities": ["CVE-2014-0160 Heartbleed Exposure", "Weak Ciphers: RC4/3DES"]},
            {"port": 4444, "service": "Metasploit", "state": "open", "version": "Metasploit Reverse TCP Shell Listener", "vulnerabilities": ["ACTIVE C2 MALWARE LISTENER"]}
        ]
        os_guess = "Linux 3.x/4.x (Hostile External Server)"
        risk = "CRITICAL"

    scan_result = {
        "target": target_clean,
        "status": "up",
        "latency_ms": round(random.uniform(0.4, 18.2), 2),
        "os_fingerprint": os_guess,
        "overall_risk": risk,
        "scanned_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "open_ports": ports,
        "total_ports_scanned": 1000
    }

    # Add scan log
    store.add_log(LogEvent(
        id=f"LOG-{random.randint(60000, 99999)}",
        timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        level="INFO",
        source="Nmap-Vulnerability-Scanner",
        event_type="PortScanCompleted",
        host="SCANNER-NODE",
        message=f"RECON: Vulnerability & Port scan completed for {target_clean} -> {len(ports)} open ports discovered. Overall Risk: {risk}."
    ))

    return scan_result

@app.post("/api/simulation/trigger")
async def trigger_simulation(req: AttackSimulationRequest):
    valid_scenarios = ["ransomware", "lateral_movement", "dns_exfiltration", "c2_beaconing"]
    if req.scenario not in valid_scenarios:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid scenario. Supported: {', '.join(valid_scenarios)}"
        )
    incident = await simulator.trigger_simulation(req.scenario, req.target_host)
    return {
        "status": "triggered",
        "scenario": req.scenario,
        "incident": incident
    }

@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await simulator.register(websocket)
    try:
        while True:
            # Handle client-sent messages if any (e.g. heartbeat or client ping)
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        simulator.unregister(websocket)
    except Exception:
        simulator.unregister(websocket)
