from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class IOC(BaseModel):
    type: str # 'ip', 'domain', 'hash', 'cve', 'file'
    value: str
    reputation: Optional[str] = "malicious"
    details: Optional[str] = None

class Incident(BaseModel):
    id: str
    timestamp: str
    title: str
    description: str
    severity: str # 'critical', 'high', 'medium', 'low', 'info'
    category: str # 'Ransomware', 'Cobalt Strike', 'Brute Force', 'Data Exfiltration', 'SQL Injection', 'Privilege Escalation', 'Lateral Movement'
    source_ip: str
    dest_ip: str
    affected_host: str
    mitre_tactic: str
    mitre_technique_id: str
    mitre_technique_name: str
    status: str # 'new', 'investigating', 'contained', 'resolved'
    assigned_to: Optional[str] = "Unassigned"
    iocs: List[IOC] = []
    process_tree: Optional[List[Dict[str, Any]]] = []
    detection_rule: Optional[str] = None
    actions_taken: List[str] = []

class LogEvent(BaseModel):
    id: str
    timestamp: str
    level: str # 'INFO', 'WARN', 'ERROR', 'CRITICAL', 'DEBUG'
    source: str # 'Sysmon', 'Suricata-NIDS', 'Zeek-DNS', 'Auth-Service', 'EDR-CrowdStrike', 'WAF'
    event_type: str
    host: str
    user: Optional[str] = "SYSTEM"
    message: str
    raw: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class Endpoint(BaseModel):
    id: str
    hostname: str
    ip: str
    os: str
    role: str # 'Domain Controller', 'Payment DB', 'Public Web Gateway', 'Finance Workstation', 'Executive Laptop', 'Kubernetes Node'
    status: str # 'healthy', 'investigating', 'compromised', 'isolated', 'offline'
    cpu_usage: float
    memory_usage: float
    agent_version: str
    last_seen: str
    active_threats_count: int = 0
    services: List[str] = []

class ThreatGeo(BaseModel):
    id: str
    timestamp: str
    source_country: str
    source_country_code: str
    source_lat: float
    source_lng: float
    source_city: str
    source_ip: str
    target_label: str
    target_lat: float
    target_lng: float
    target_ip: str
    attack_type: str
    severity: str

class SystemStats(BaseModel):
    active_incidents: int
    critical_alerts: int
    high_alerts: int
    blocked_attacks_today: int
    mttd_minutes: float
    mttr_minutes: float
    current_eps: int
    defcon_level: int # 1 to 5 (1 is emergency, 5 is calm)
    defcon_status: str
    total_endpoints: int
    compromised_endpoints: int
    isolated_endpoints: int

class IncidentActionRequest(BaseModel):
    action: str # 'isolate_host', 'block_ip', 'kill_process', 'resolve', 'investigate'
    analyst_name: Optional[str] = "SOC Analyst"
    notes: Optional[str] = None

class AttackSimulationRequest(BaseModel):
    scenario: str # 'ransomware', 'lateral_movement', 'dns_exfiltration', 'brute_force', 'c2_beaconing', 'sql_injection'
    target_host: Optional[str] = None
