import asyncio
import datetime
import random
from typing import Set
from fastapi import WebSocket
from engine.data_store import store
from models import LogEvent, Incident, ThreatGeo, IOC

class ThreatSimulator:
    def __init__(self):
        self.active_websockets: Set[WebSocket] = set()
        self.is_running = False
        self.attack_active = False

    async def register(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        # Send initial full state bundle
        try:
            initial_state = {
                "type": "INIT_STATE",
                "stats": store.get_stats().model_dump(),
                "incidents": [inc.model_dump() for inc in store.incidents.values()],
                "endpoints": [ep.model_dump() for ep in store.endpoints.values()],
                "logs": [log.model_dump() for log in list(store.logs)[-50:]],
                "geo_threats": [g.model_dump() for g in list(store.geo_threats)[-15:]],
                "firewall_rules": store.firewall_rules
            }
            await websocket.send_json(initial_state)
        except Exception as e:
            print(f"Error sending init state: {e}")

    def unregister(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)

    async def broadcast(self, message: dict):
        closed = []
        for ws in self.active_websockets:
            try:
                await ws.send_json(message)
            except Exception:
                closed.append(ws)
        for ws in closed:
            self.active_websockets.discard(ws)

    async def start(self):
        self.is_running = True
        while self.is_running:
            await self._step()
            await asyncio.sleep(1.8)

    async def _step(self):
        # Fluctuate EPS naturally
        jitter = random.randint(-15, 25)
        store.current_eps = max(140, min(650, store.current_eps + jitter))
        
        # Slight dynamic update to endpoint CPU/Memory
        for ep in store.endpoints.values():
            if ep.status != "offline" and ep.status != "isolated":
                ep.cpu_usage = max(5.0, min(99.0, round(ep.cpu_usage + random.uniform(-3.5, 3.5), 1)))
                ep.memory_usage = max(10.0, min(98.0, round(ep.memory_usage + random.uniform(-1.0, 1.0), 1)))

        # Periodically generate realistic background log events
        sources_and_events = [
            ("Sysmon", "INFO", "Process Create", "C:\\Windows\\System32\\conhost.exe 0xffffffff -ForceV1", "DC01-ROOT.CORP.INTERNAL"),
            ("Zeek-DNS", "INFO", "DNS Query", "Standard query 0x7c12 A analytics.datadoghq.com (TTL 60)", "K8S-WORKER-US-EAST-02"),
            ("Suricata-NIDS", "INFO", "HTTP Flow", "GET /api/v1/healthcheck HTTP/1.1 Status: 200 OK", "EXT-EDGE-INGRESS-01"),
            ("Auth-Service", "INFO", "User Auth", "SSH Key authentication accepted for dev_deployer from 10.0.20.5", "K8S-WORKER-US-EAST-02"),
            ("Border-PaloAlto-FW", "INFO", "Traffic Allowed", "TCP 10.0.10.12:54882 -> 142.250.190.46:443 (Google Cloud)", "LAPTOP-CEO-EXEC"),
            ("EDR-CrowdStrike", "INFO", "File Write", "Modified C:\\ProgramData\\Application\\cache.db (Hash verified clean)", "WS-FINANCE-04"),
            ("WAF", "INFO", "WAF Pass", "Clean TLS 1.3 handshake from 172.56.21.90 (Chrome/122)", "EXT-EDGE-INGRESS-01")
        ]
        
        src, lvl, evt_type, msg, host = random.choice(sources_and_events)
        new_log = LogEvent(
            id=f"LOG-{random.randint(10000, 99999)}",
            timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            level=lvl,
            source=src,
            event_type=evt_type,
            host=host,
            user="SYSTEM" if "Sysmon" in src else "svc_app",
            message=msg
        )
        store.add_log(new_log)

        # Occasional random threat geo event (every ~6-10 steps)
        if random.random() < 0.28:
            geos = [
                ("Germany", "DE", 52.5200, 13.4050, "Berlin", "185.220.101.44", "Port Scan Probe", "low"),
                ("Singapore", "SG", 1.3521, 103.8198, "Singapore", "118.189.20.1", "API Fuzzing", "medium"),
                ("Russia", "RU", 59.9343, 30.3351, "St. Petersburg", "194.26.29.112", "C2 Keepalive", "critical"),
                ("United States", "US", 37.7749, -122.4194, "San Francisco", "104.28.19.4", "Suspicious Referrer", "low"),
                ("India", "IN", 19.0760, 72.8777, "Mumbai", "103.21.244.0", "SSL Certificate Probe", "low"),
                ("China", "CN", 31.2304, 121.4737, "Shanghai", "222.186.42.11", "Web Crawler / Directory Buster", "medium")
            ]
            country, cc, lat, lng, city, ip, attack, sev = random.choice(geos)
            geo_ev = ThreatGeo(
                id=f"GEO-{random.randint(1000, 9999)}",
                timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                source_country=country,
                source_country_code=cc,
                source_lat=lat,
                source_lng=lng,
                source_city=city,
                source_ip=ip,
                target_label="Corporate Edge Gateway",
                target_lat=38.9072,
                target_lng=-77.0369,
                target_ip="172.20.0.15",
                attack_type=attack,
                severity=sev
            )
            store.add_geo_threat(geo_ev)
            await self.broadcast({
                "type": "GEO_THREAT",
                "geo": geo_ev.model_dump()
            })

        # Broadcast periodic telemetry update
        stats = store.get_stats().model_dump()
        await self.broadcast({
            "type": "TELEMETRY_UPDATE",
            "stats": stats,
            "new_log": new_log.model_dump(),
            "endpoints": [ep.model_dump() for ep in store.endpoints.values()]
        })

    async def trigger_simulation(self, scenario: str, target_host: str = None) -> Incident:
        now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        inc_id = f"INC-2026-{random.randint(1100, 9999)}"

        if scenario == "ransomware":
            target = target_host or "WS-FINANCE-04"
            incident = Incident(
                id=inc_id,
                timestamp=now_str,
                title="LockBit 3.0 Ransomware Execution & Volume Shadow Copy Deletion",
                description=f"Canary honeypot file 'C:\\Shared\\Financial_Q3.xlsx.lockbit' was encrypted. Process 'vssadmin.exe delete shadows /all /quiet' was invoked, followed by batch encryption threads.",
                severity="critical",
                category="Ransomware",
                source_ip="185.220.101.5",
                dest_ip="10.0.10.84",
                affected_host=target,
                mitre_tactic="Impact",
                mitre_technique_id="T1486",
                mitre_technique_name="Data Encrypted for Impact",
                status="new",
                assigned_to="Incident Response Swat",
                detection_rule="EDR_RULE_RANSOMWARE_BEHAVIOR_CANARY_TRIP_VSSADMIN",
                iocs=[
                    IOC(type="hash", value="4a2f8b5c901e23d4f56789abcdef0123456789abcdef0123456789abcdef0123", reputation="malicious", details="LockBit 3.0 Encrypter payload"),
                    IOC(type="ip", value="185.220.101.5", reputation="malicious", details="C2 ransom key drop server"),
                    IOC(type="file", value="HOW_TO_RECOVER_FILES.txt", details="Ransom Note drop in %USERPROFILE%")
                ],
                process_tree=[
                    {"pid": 5120, "name": "powershell.exe", "user": "CORP\\compromised_user"},
                    {"pid": 8840, "name": "LB3_encrypter.exe", "user": "CORP\\compromised_user"},
                    {"pid": 8844, "name": "vssadmin.exe delete shadows /all /quiet", "user": "NT AUTHORITY\\SYSTEM"}
                ],
                actions_taken=["Canary trap tripped", "Automated incident escalated to DEFCON 1"]
            )
            # Spike EPS
            store.current_eps = 540

        elif scenario == "lateral_movement":
            target = target_host or "DC01-ROOT.CORP.INTERNAL"
            incident = Incident(
                id=inc_id,
                timestamp=now_str,
                title="Pass-the-Hash & PsExec Lateral Movement to Domain Controller",
                description=f"WMI/PsExec session initiated from WS-FINANCE-04 to {target} using NTLM hash of Domain Admin account 'CORP\\da_svc'.",
                severity="critical",
                category="Lateral Movement",
                source_ip="10.0.10.84",
                dest_ip="10.0.1.10",
                affected_host=target,
                mitre_tactic="Lateral Movement",
                mitre_technique_id="T1021.002",
                mitre_technique_name="SMB/Windows Admin Shares",
                status="new",
                assigned_to="SOC Lead",
                detection_rule="SIGMA_WIN_LATERAL_PSEXEC_REMOTE_SERVICE_CREATION",
                iocs=[
                    IOC(type="ip", value="10.0.10.84", reputation="suspicious", details="Pivot workstation"),
                    IOC(type="hash", value="d2d8c3e8092f694e9f75a74e54f9a0d8ad755a5b6c31f41d911b6973e8e2e2a1", reputation="malicious", details="Mimikatz memory dump")
                ],
                process_tree=[
                    {"pid": 1400, "name": "services.exe", "user": "SYSTEM"},
                    {"pid": 9204, "name": "PSEXESVC.exe", "user": "SYSTEM"},
                    {"pid": 9212, "name": "cmd.exe /c whoami & net user /domain", "user": "SYSTEM"}
                ]
            )
            store.current_eps = 480

        elif scenario == "dns_exfiltration":
            target = target_host or "K8S-WORKER-US-EAST-02"
            incident = Incident(
                id=inc_id,
                timestamp=now_str,
                title="Covert DNS Tunneling & Database Exfiltration",
                description="Zeek detected abnormal volume of Base64 encoded subdomains queried to rogue authoritative nameserver 'tunnel.exfil-ns9.org' at 120 queries/sec.",
                severity="high",
                category="Data Exfiltration",
                source_ip="10.0.20.102",
                dest_ip="94.140.14.14",
                affected_host=target,
                mitre_tactic="Exfiltration",
                mitre_technique_id="T1048",
                mitre_technique_name="Exfiltration Over Alternative Protocol (DNS)",
                status="new",
                assigned_to="Network Security Team",
                detection_rule="ZEEK_DNS_ANOMALOUS_SUBDOMAIN_LENGTH_EXFIL_DETECTION",
                iocs=[
                    IOC(type="domain", value="tunnel.exfil-ns9.org", reputation="malicious", details="Iodine DNS tunnel server"),
                    IOC(type="ip", value="94.140.14.14", reputation="malicious", details="Rogue DNS NS IP")
                ],
                process_tree=[
                    {"pid": 2840, "name": "python3 /app/export_worker.py", "user": "appuser"}
                ]
            )
            store.current_eps = 390

        else: # c2_beaconing / default
            target = target_host or "PROD-DB-PAYMENTS-CLUSTER"
            incident = Incident(
                id=inc_id,
                timestamp=now_str,
                title="Cobalt Strike HTTPS Malleable C2 Jitter Beaconing",
                description="Suricata identified repeating TLS sessions with fixed 45s interval and 15% jitter to unclassified IP with self-signed certificate mimicking Amazon AWS.",
                severity="critical",
                category="Cobalt Strike",
                source_ip="194.26.29.112",
                dest_ip="10.0.3.50",
                affected_host=target,
                mitre_tactic="Command and Control",
                mitre_technique_id="T1071.001",
                mitre_technique_name="Web Protocols C2",
                status="new",
                assigned_to="SOC Tier 2",
                detection_rule="SURICATA_TLS_JA3_COBALT_STRIKE_DEFAULT_MALLEABLE_PROFILE",
                iocs=[
                    IOC(type="ip", value="194.26.29.112", reputation="malicious", details="Cobalt Strike Team Server"),
                    IOC(type="domain", value="c2-sync-analytics.online", reputation="malicious", details="C2 Domain")
                ]
            )
            store.current_eps = 430

        # Save incident to datastore
        store.add_incident(incident)

        # Add critical log
        log_event = LogEvent(
            id=f"LOG-{random.randint(20000, 99999)}",
            timestamp=now_str,
            level="CRITICAL",
            source="SOC-Detection-Engine",
            event_type="AttackScenarioDetected",
            host=incident.affected_host,
            message=f"CRITICAL DETECTION: {incident.title} (Incident ID: {incident.id})"
        )
        store.add_log(log_event)

        # Broadcast new incident to all connected clients
        await self.broadcast({
            "type": "NEW_INCIDENT",
            "incident": incident.model_dump(),
            "stats": store.get_stats().model_dump(),
            "new_log": log_event.model_dump(),
            "endpoints": [ep.model_dump() for ep in store.endpoints.values()]
        })

        return incident

simulator = ThreatSimulator()
