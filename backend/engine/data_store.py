import datetime
import random
from typing import List, Dict, Any, Optional
from collections import deque
from models import Incident, LogEvent, Endpoint, ThreatGeo, SystemStats, IOC

class DataStore:
    def __init__(self):
        self.lock = False
        self.max_logs = 500
        self.logs: deque = deque(maxlen=self.max_logs)
        self.incidents: Dict[str, Incident] = {}
        self.endpoints: Dict[str, Endpoint] = {}
        self.firewall_rules: List[Dict[str, Any]] = []
        self.geo_threats: deque = deque(maxlen=60)
        self.blocked_today_count = 1432
        self.base_eps = 240
        self.current_eps = 240
        self.defcon_level = 3 # 3 is Elevated, 2 is Severe, 1 is Critical
        
        self._init_endpoints()
        self._init_incidents()
        self._init_logs()
        self._init_geo_threats()

    def _init_endpoints(self):
        assets = [
            {
                "id": "ep-dc-01",
                "hostname": "DC01-ROOT.CORP.INTERNAL",
                "ip": "10.0.1.10",
                "os": "Windows Server 2022 Datacenter",
                "role": "Domain Controller & Active Directory",
                "status": "healthy",
                "cpu_usage": 28.4,
                "memory_usage": 64.2,
                "agent_version": "CrowdStrike Falcon 7.14",
                "last_seen": "Just now",
                "active_threats_count": 0,
                "services": ["Active Directory", "DNS", "Kerberos", "LDAP", "KDC"]
            },
            {
                "id": "ep-pay-01",
                "hostname": "PROD-DB-PAYMENTS-CLUSTER",
                "ip": "10.0.3.50",
                "os": "Red Hat Enterprise Linux 9.2",
                "role": "Payment DB (PCI-DSS Zone)",
                "status": "investigating",
                "cpu_usage": 72.1,
                "memory_usage": 88.5,
                "agent_version": "Wazuh Agent 4.7.2",
                "last_seen": "Just now",
                "active_threats_count": 1,
                "services": ["PostgreSQL 16", "Redis Cluster", "Vault-Transit", "SSH"]
            },
            {
                "id": "ep-web-gw",
                "hostname": "EXT-EDGE-INGRESS-01",
                "ip": "172.20.0.15",
                "os": "Ubuntu 22.04 LTS",
                "role": "Public Web Gateway & Nginx Ingress",
                "status": "healthy",
                "cpu_usage": 45.2,
                "memory_usage": 52.0,
                "agent_version": "Suricata + Wazuh",
                "last_seen": "Just now",
                "active_threats_count": 0,
                "services": ["Nginx Ingress", "Envoy Proxy", "Cloudflare WAF Sync", "HTTPS"]
            },
            {
                "id": "ep-fin-04",
                "hostname": "WS-FINANCE-04",
                "ip": "10.0.10.84",
                "os": "Windows 11 Pro Enterprise",
                "role": "Finance Workstation",
                "status": "compromised",
                "cpu_usage": 94.7,
                "memory_usage": 91.3,
                "agent_version": "CrowdStrike Falcon 7.14",
                "last_seen": "2 mins ago",
                "active_threats_count": 2,
                "services": ["SMBv2", "Outlook 365", "SAP Client", "RDP"]
            },
            {
                "id": "ep-exec-01",
                "hostname": "LAPTOP-CEO-EXEC",
                "ip": "10.0.10.12",
                "os": "macOS Sonoma 14.5",
                "role": "Executive Laptop",
                "status": "healthy",
                "cpu_usage": 18.0,
                "memory_usage": 42.1,
                "agent_version": "SentinelOne EDR 23.3",
                "last_seen": "Just now",
                "active_threats_count": 0,
                "services": ["GlobalProtect VPN", "FileVault", "MDM Jamf", "Slack"]
            },
            {
                "id": "ep-k8s-node2",
                "hostname": "K8S-WORKER-US-EAST-02",
                "ip": "10.0.20.102",
                "os": "Debian 12 Bookworm",
                "role": "Kubernetes Microservices Node",
                "status": "healthy",
                "cpu_usage": 58.6,
                "memory_usage": 69.4,
                "agent_version": "Falco Runtime Security 0.37",
                "last_seen": "Just now",
                "active_threats_count": 0,
                "services": ["Kubelet", "Containerd", "Calico CNI", "CoreDNS"]
            },
            {
                "id": "ep-backup-01",
                "hostname": "IMMUTABLE-VEEAM-BACKUP",
                "ip": "10.0.99.5",
                "os": "Rocky Linux 9 (Hardened Kernel)",
                "role": "Air-Gapped Backup Vault",
                "status": "healthy",
                "cpu_usage": 12.3,
                "memory_usage": 33.0,
                "agent_version": "Hardened Bastion Agent",
                "last_seen": "1 min ago",
                "active_threats_count": 0,
                "services": ["ZFS Snapshots", "TLS Syslog", "MFA SSH Bastion"]
            }
        ]
        for a in assets:
            self.endpoints[a["id"]] = Endpoint(**a)

    def _init_incidents(self):
        initial_incidents = [
            {
                "id": "INC-2026-0842",
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "title": "Cobalt Strike Beacon Ingress & LSASS Memory Dump",
                "description": "Suricata detected suspicious C2 beaconing over port 443 with anomalous JA3 fingerprint, followed by Sysmon Event ID 10 (ProcessAccess) targeting lsass.exe by unapproved powershell script.",
                "severity": "critical",
                "category": "Cobalt Strike",
                "source_ip": "194.26.29.112",
                "dest_ip": "10.0.10.84",
                "affected_host": "WS-FINANCE-04",
                "mitre_tactic": "Credential Access",
                "mitre_technique_id": "T1003.001",
                "mitre_technique_name": "OS Credential Dumping: LSASS Memory",
                "status": "new",
                "assigned_to": "Tier 2 SOC Lead",
                "detection_rule": "SIGMA_WIN_LSASS_PROCESS_ACCESS_POWERSHELL_A24",
                "iocs": [
                    {"type": "ip", "value": "194.26.29.112", "reputation": "malicious", "details": "APT29 Cobalt Strike TeamServer"},
                    {"type": "hash", "value": "d2d8c3e8092f694e9f75a74e54f9a0d8ad755a5b6c31f41d911b6973e8e2e2a1", "reputation": "malicious", "details": "Mimikatz payload"},
                    {"type": "domain", "value": "c2-sync-analytics.online", "reputation": "malicious", "details": "Active C2 beacon endpoint"}
                ],
                "process_tree": [
                    {"pid": 4820, "name": "explorer.exe", "user": "CORP\\sarah.connor"},
                    {"pid": 7112, "name": "powershell.exe -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQA...", "user": "CORP\\sarah.connor"},
                    {"pid": 8940, "name": "rundll32.exe C:\\Users\\Public\\sync.dll,DllRegisterServer", "user": "NT AUTHORITY\\SYSTEM"}
                ],
                "actions_taken": ["EDR Alert Generated", "Auto-quarantine recommendation triggered"]
            },
            {
                "id": "INC-2026-0841",
                "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=14)).strftime("%Y-%m-%d %H:%M:%S"),
                "title": "SQL Injection & Unauthorized Table Dump on Payment Cluster",
                "description": "WAF blocked multiple automated Blind SQL Injection payloads targeting customer payment token endpoints. Database audit detected abnormal query latency and schema enumeration attempts.",
                "severity": "high",
                "category": "SQL Injection",
                "source_ip": "185.220.101.5",
                "dest_ip": "10.0.3.50",
                "affected_host": "PROD-DB-PAYMENTS-CLUSTER",
                "mitre_tactic": "Initial Access",
                "mitre_technique_id": "T1190",
                "mitre_technique_name": "Exploit Public-Facing Application",
                "status": "investigating",
                "assigned_to": "AppSec Incident Responder",
                "detection_rule": "WAF_RULE_942100_SQLI_UNION_SELECT_BLIND",
                "iocs": [
                    {"type": "ip", "value": "185.220.101.5", "reputation": "malicious", "details": "Known Tor Exit Node used in credential scraping"}
                ],
                "process_tree": [
                    {"pid": 1102, "name": "nginx: worker process", "user": "www-data"},
                    {"pid": 3419, "name": "postgres: billing_user payments_db [local]", "user": "postgres"}
                ],
                "actions_taken": ["WAF Rate limiting engaged", "Database read-only replica failover tested"]
            },
            {
                "id": "INC-2026-0839",
                "timestamp": (datetime.datetime.now() - datetime.timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M:%S"),
                "title": "Mass SSH & Kerberos Password Spraying",
                "description": "Over 1,200 failed Kerberos Pre-Authentication requests detected from external botnet pool targeting domain controller administrator accounts.",
                "severity": "medium",
                "category": "Brute Force",
                "source_ip": "45.154.255.89",
                "dest_ip": "10.0.1.10",
                "affected_host": "DC01-ROOT.CORP.INTERNAL",
                "mitre_tactic": "Credential Access",
                "mitre_technique_id": "T1110.003",
                "mitre_technique_name": "Password Spraying",
                "status": "contained",
                "assigned_to": "SOC Tier 1 Analyst",
                "detection_rule": "WIN_EVENT_4771_KERBEROS_PREAUTH_FAIL_BURST",
                "iocs": [
                    {"type": "ip", "value": "45.154.255.89", "reputation": "malicious", "details": "Hostile Botnet Scanner Node"}
                ],
                "actions_taken": ["Source subnet auto-blocked by border firewall", "Compromised user accounts locked for password reset"]
            }
        ]
        for inc in initial_incidents:
            self.incidents[inc["id"]] = Incident(**inc)

    def _init_logs(self):
        log_templates = [
            ("Sysmon", "INFO", "Process Create: C:\\Windows\\System32\\svchost.exe -k LocalServiceNetworkRestricted", "DC01-ROOT.CORP.INTERNAL"),
            ("Suricata-NIDS", "WARN", "ET SCAN Potential SSH Brute Force attempt detected on port 22", "EXT-EDGE-INGRESS-01"),
            ("Zeek-DNS", "INFO", "DNS Query resolved: api.github.com A 140.82.121.3 (TTL 42s)", "K8S-WORKER-US-EAST-02"),
            ("EDR-CrowdStrike", "CRITICAL", "Detection: ProcessAccess lsass.exe granted with PROCESS_ALL_ACCESS (0x1FFFFF)", "WS-FINANCE-04"),
            ("Auth-Service", "INFO", "PAM auth accepted for admin_jdoe via YubiKey FIDO2 WebAuthn", "IMMUTABLE-VEEAM-BACKUP"),
            ("WAF", "ERROR", "HTTP 403 Blocked: Suspicious URI pattern '../..//etc/passwd' triggered rule 930110", "EXT-EDGE-INGRESS-01"),
            ("Sysmon", "WARN", "Network Connection: powershell.exe established TCP 194.26.29.112:443", "WS-FINANCE-04"),
            ("Zeek-DNS", "ERROR", "DNS TXT Exfiltration detected: anomalous length 240 bytes to c2-sync-analytics.online", "WS-FINANCE-04")
        ]
        
        now = datetime.datetime.now()
        for i in range(40):
            source, level, msg, host = random.choice(log_templates)
            time_offset = now - datetime.timedelta(seconds=(40 - i) * 6)
            log = LogEvent(
                id=f"LOG-{1000 + i}",
                timestamp=time_offset.strftime("%Y-%m-%d %H:%M:%S"),
                level=level,
                source=source,
                event_type="SecurityEvent",
                host=host,
                user="SYSTEM" if "Sysmon" in source else "nginx",
                message=msg
            )
            self.logs.append(log)

    def _init_geo_threats(self):
        sample_geos = [
            {
                "id": "geo-1",
                "source_country": "Russia", "source_country_code": "RU",
                "source_lat": 55.7558, "source_lng": 37.6173, "source_city": "Moscow",
                "source_ip": "194.26.29.112",
                "target_label": "US Headquarters (DC01)", "target_lat": 38.9072, "target_lng": -77.0369,
                "target_ip": "10.0.1.10", "attack_type": "Cobalt Strike C2", "severity": "critical"
            },
            {
                "id": "geo-2",
                "source_country": "China", "source_country_code": "CN",
                "source_lat": 39.9042, "source_lng": 116.4074, "source_city": "Beijing",
                "source_ip": "112.90.82.14",
                "target_label": "Payment Gateway (PROD-DB)", "target_lat": 37.7749, "target_lng": -122.4194,
                "target_ip": "10.0.3.50", "attack_type": "Blind SQL Injection", "severity": "high"
            },
            {
                "id": "geo-3",
                "source_country": "Netherlands", "source_country_code": "NL",
                "source_lat": 52.3676, "source_lng": 4.9041, "source_city": "Amsterdam",
                "source_ip": "185.220.101.5",
                "target_label": "Finance Workstation", "target_lat": 51.5074, "target_lng": -0.1278,
                "target_ip": "10.0.10.84", "attack_type": "Tor Exit Scanner", "severity": "medium"
            },
            {
                "id": "geo-4",
                "source_country": "Brazil", "source_country_code": "BR",
                "source_lat": -23.5505, "source_lng": -46.6333, "source_city": "São Paulo",
                "source_ip": "177.54.12.9",
                "target_label": "Edge Ingress Proxy", "target_lat": 40.7128, "target_lng": -74.0060,
                "target_ip": "172.20.0.15", "attack_type": "DDoS SYN Flood", "severity": "medium"
            },
            {
                "id": "geo-5",
                "source_country": "North Korea", "source_country_code": "KP",
                "source_lat": 39.0392, "source_lng": 125.7625, "source_city": "Pyongyang",
                "source_ip": "175.45.176.8",
                "target_label": "Executive Laptop (EXEC-01)", "target_lat": 37.5665, "target_lng": 126.9780,
                "target_ip": "10.0.10.12", "attack_type": "Spearphishing Recon", "severity": "high"
            }
        ]
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for g in sample_geos:
            g["timestamp"] = now
            self.geo_threats.append(ThreatGeo(**g))

    def add_log(self, log: LogEvent):
        self.logs.append(log)

    def add_geo_threat(self, threat: ThreatGeo):
        self.geo_threats.append(threat)

    def add_incident(self, incident: Incident):
        self.incidents[incident.id] = incident
        # Update endpoint active threats
        for ep in self.endpoints.values():
            if ep.hostname == incident.affected_host or ep.ip == incident.dest_ip:
                ep.active_threats_count += 1
                if incident.severity == "critical":
                    ep.status = "compromised"
                elif ep.status == "healthy":
                    ep.status = "investigating"

    def get_stats(self) -> SystemStats:
        critical = sum(1 for i in self.incidents.values() if i.severity == "critical" and i.status != "resolved")
        high = sum(1 for i in self.incidents.values() if i.severity == "high" and i.status != "resolved")
        active = sum(1 for i in self.incidents.values() if i.status != "resolved")
        compromised = sum(1 for ep in self.endpoints.values() if ep.status == "compromised")
        isolated = sum(1 for ep in self.endpoints.values() if ep.status == "isolated")
        
        # DEFCON calculation based on active criticals & compromised endpoints
        if critical >= 2 or compromised >= 2:
            defcon = 1
            status = "DEFCON 1: MAXIMUM ALERT - ACTIVE THREAT IN PROGRESS"
        elif critical == 1 or high >= 2 or compromised == 1:
            defcon = 2
            status = "DEFCON 2: SEVERE THREAT - INCIDENT RESPONSE ACTIVE"
        elif high == 1 or active > 3:
            defcon = 3
            status = "DEFCON 3: ELEVATED RISK - HEIGHTENED MONITORING"
        elif active > 0:
            defcon = 4
            status = "DEFCON 4: GUARDED - ROUTINE SOC TRIAGE"
        else:
            defcon = 5
            status = "DEFCON 5: NORMAL - ALL SYSTEMS SECURE"

        return SystemStats(
            active_incidents=active,
            critical_alerts=critical,
            high_alerts=high,
            blocked_attacks_today=self.blocked_today_count,
            mttd_minutes=4.2,
            mttr_minutes=18.5,
            current_eps=self.current_eps,
            defcon_level=defcon,
            defcon_status=status,
            total_endpoints=len(self.endpoints),
            compromised_endpoints=compromised,
            isolated_endpoints=isolated
        )

    def isolate_endpoint(self, host_id_or_name: str) -> bool:
        for ep in self.endpoints.values():
            if ep.id == host_id_or_name or ep.hostname == host_id_or_name:
                ep.status = "isolated"
                self.add_log(LogEvent(
                    id=f"LOG-{random.randint(5000, 9999)}",
                    timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    level="WARN",
                    source="SOC-Containment-Action",
                    event_type="HostIsolation",
                    host=ep.hostname,
                    message=f"CONTAINMENT: Host {ep.hostname} ({ep.ip}) was instantly ISOLATED from the network via EDR zero-trust isolation rule."
                ))
                return True
        return False

    def release_endpoint(self, host_id_or_name: str) -> bool:
        for ep in self.endpoints.values():
            if ep.id == host_id_or_name or ep.hostname == host_id_or_name:
                ep.status = "healthy"
                ep.active_threats_count = 0
                self.add_log(LogEvent(
                    id=f"LOG-{random.randint(5000, 9999)}",
                    timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    level="INFO",
                    source="SOC-Containment-Action",
                    event_type="HostRelease",
                    host=ep.hostname,
                    message=f"REMEDIATION: Host {ep.hostname} ({ep.ip}) isolation lifted and restored to normal network access."
                ))
                return True
        return False

    def block_ip(self, ip_address: str, reason: str = "SOC Manual Block") -> bool:
        rule = {
            "rule_id": f"FW-DROP-{len(self.firewall_rules) + 101}",
            "ip": ip_address,
            "action": "DROP_ALL",
            "reason": reason,
            "created_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        self.firewall_rules.append(rule)
        self.blocked_today_count += 1
        self.add_log(LogEvent(
            id=f"LOG-{random.randint(5000, 9999)}",
            timestamp=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            level="WARN",
            source="Border-PaloAlto-FW",
            event_type="FirewallRuleAdd",
            host="BORDER-GATEWAY",
            message=f"FIREWALL ENFORCEMENT: IP {ip_address} has been globally added to blackhole DROP table. Rule ID: {rule['rule_id']}"
        ))
        return True

store = DataStore()
