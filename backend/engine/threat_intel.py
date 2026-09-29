import re
from typing import Dict, Any, List, Optional

KNOWN_CVES = {
    "CVE-2024-21413": {
        "id": "CVE-2024-21413",
        "title": "Microsoft Outlook Remote Code Execution Vulnerability (MonikerLink)",
        "cvss": 9.8,
        "severity": "CRITICAL",
        "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "affected": "Microsoft Office 2016, 2019, 2021, Microsoft 365 Apps",
        "description": "Improper neutralization of special elements in hyperlink moniker parsing allows remote code execution when previewing an email.",
        "mitigation": "Apply Microsoft February 2024 Patch Tuesday updates; block outbound SMB (TCP 445).",
        "mitre_technique": "T1204.001 - User Execution: Malicious Link"
    },
    "CVE-2023-34362": {
        "id": "CVE-2023-34362",
        "title": "MOVEit Transfer SQL Injection to Remote Code Execution",
        "cvss": 9.8,
        "severity": "CRITICAL",
        "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "affected": "Progress MOVEit Transfer versions before 2021.0.6, 2021.1.4, 2022.0.4",
        "description": "SQL injection in MOVEit Transfer web app leads to unauthorized access and remote code execution, heavily exploited by CL0P ransomware group.",
        "mitigation": "Disable HTTP/HTTPS access on ports 80/443 to MOVEit Transfer; patch immediately.",
        "mitre_technique": "T1190 - Exploit Public-Facing Application"
    },
    "CVE-2021-44228": {
        "id": "CVE-2021-44228",
        "title": "Apache Log4j2 JNDI Remote Code Execution (Log4Shell)",
        "cvss": 10.0,
        "severity": "CRITICAL",
        "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        "affected": "Apache Log4j 2.0-beta9 through 2.15.0",
        "description": "JNDI lookup feature does not protect against attacker-controlled LDAP and other JNDI-related endpoints.",
        "mitigation": "Upgrade to Log4j 2.17.1 or later; remove JndiLookup class from log4j-core jar.",
        "mitre_technique": "T1190 - Exploit Public-Facing Application"
    },
    "CVE-2024-3400": {
        "id": "CVE-2024-3400",
        "title": "Palo Alto Networks PAN-OS GlobalProtect Command Injection",
        "cvss": 10.0,
        "severity": "CRITICAL",
        "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        "affected": "PAN-OS 10.2, PAN-OS 11.0, PAN-OS 11.1 with GlobalProtect gateway enabled",
        "description": "Command injection vulnerability allows an unauthenticated remote attacker to execute arbitrary OS commands with root privileges.",
        "mitigation": "Apply hotfix provided by vendor; enable Threat Prevention Signature 95187.",
        "mitre_technique": "T1190 - Exploit Public-Facing Application"
    },
    "CVE-2023-4966": {
        "id": "CVE-2023-4966",
        "title": "Citrix NetScaler ADC / Gateway Sensitive Information Disclosure (Citrix Bleed)",
        "cvss": 9.4,
        "severity": "CRITICAL",
        "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
        "affected": "NetScaler ADC and Gateway 13.0, 13.1, 14.1",
        "description": "Buffer over-read allows unauthenticated attackers to extract session cookies from memory, bypassing multi-factor authentication.",
        "mitigation": "Update NetScaler firmware; terminate all active user sessions post-patch.",
        "mitre_technique": "T1539 - Steal Web Session Cookie"
    }
}

KNOWN_ACTORS = {
    "APT29": {
        "name": "APT29 (Cozy Bear / Midnight Blizzard)",
        "origin": "Russia (SVR)",
        "targets": "Governments, Think Tanks, Defense, Tech Providers",
        "techniques": ["T1078 Valid Accounts", "T1566 Phishing", "T1098 Account Manipulation", "T1071 Application Layer Protocol"],
        "malware": ["WellMess", "SolarMarker", "CosmicDuke", "Duke variants"],
        "confidence": "High"
    },
    "LockBit": {
        "name": "LockBit 3.0 (Black)",
        "origin": "Cybercrime Syndicate (RaaS)",
        "targets": "Healthcare, Critical Infrastructure, Financial, Industrial",
        "techniques": ["T1486 Data Encrypted for Impact", "T1490 Inhibit System Recovery", "T1059 Command and Scripting Interpreter"],
        "malware": ["LockBit Ransomware", "StealBit", "PsExec"],
        "confidence": "Very High"
    },
    "Lazarus": {
        "name": "Lazarus Group (HIDDEN COBRA)",
        "origin": "North Korea (RGB)",
        "targets": "Cryptocurrency, Aerospace, Defense, Financial institutions",
        "techniques": ["T1566.001 Spearphishing Attachment", "T1204 User Execution", "T1027 Obfuscated Files"],
        "malware": ["AppleJeus", "FALLCHILL", "HOPLIGHT", "Brambul"],
        "confidence": "High"
    },
    "Volt Typhoon": {
        "name": "Volt Typhoon (BRONZE SILHOUETTE)",
        "origin": "China (State-Sponsored)",
        "targets": "US Critical Infrastructure, Communications, Energy, Water, Transportation",
        "techniques": ["T1078 Living off the Land", "T1018 Remote System Discovery", "T1059.001 PowerShell"],
        "malware": ["Fast Reverse Proxy (FRP)", "Earthworm", "Mimikatz"],
        "confidence": "High"
    }
}

KNOWN_IOCS = {
    "185.220.101.5": {
        "type": "ip",
        "threat_score": 96,
        "category": "Tor Exit Node / C2 Infrastructure",
        "actor": "LockBit Affiliate",
        "asn": "AS208323",
        "country": "Germany",
        "tags": ["tor", "c2", "ransomware", "brute-force"],
        "last_seen": "12 minutes ago"
    },
    "194.26.29.112": {
        "type": "ip",
        "threat_score": 92,
        "category": "Cobalt Strike TeamServer Beacon",
        "actor": "APT29",
        "asn": "AS49981",
        "country": "Netherlands",
        "tags": ["cobalt-strike", "c2", "apt29", "ssl-anomalous"],
        "last_seen": "4 minutes ago"
    },
    "45.154.255.89": {
        "type": "ip",
        "threat_score": 88,
        "category": "Credential Stuffing & SSH Scanner",
        "actor": "Unknown Botnet",
        "asn": "AS47583",
        "country": "Seychelles",
        "tags": ["scanner", "ssh-bruteforce", "masscan"],
        "last_seen": "1 minute ago"
    },
    "c2-sync-analytics.online": {
        "type": "domain",
        "threat_score": 99,
        "category": "Domain Generation Algorithm / Cobalt Strike C2",
        "actor": "Lazarus Group",
        "registrar": "NameCheap",
        "dns_records": ["A 194.26.29.112", "NS ns1.badtraffic.net"],
        "tags": ["dga", "c2", "tls-spoofing", "lazarus"],
        "last_seen": "30 minutes ago"
    },
    "update-microsoft-security.com": {
        "type": "domain",
        "threat_score": 94,
        "category": "Typosquatting & Phishing Gateway",
        "actor": "FIN7",
        "registrar": "Porkbun",
        "dns_records": ["A 185.143.223.12"],
        "tags": ["typosquat", "phishing", "credential-harvesting"],
        "last_seen": "2 hours ago"
    },
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855": {
        "type": "hash",
        "threat_score": 0,
        "category": "Null SHA256 (Empty File)",
        "file_name": "empty.tmp",
        "tags": ["benign"],
        "last_seen": "N/A"
    },
    "d2d8c3e8092f694e9f75a74e54f9a0d8ad755a5b6c31f41d911b6973e8e2e2a1": {
        "type": "hash",
        "threat_score": 98,
        "category": "Mimikatz Memory Dumper (LSASS injector)",
        "actor": "Multiple Threat Actors",
        "file_name": "mimi64.exe",
        "file_type": "PE32+ executable (GUI) x86-64",
        "tags": ["credential-access", "lsass", "mimikatz", "hacktool"],
        "signature": "Win64.Hacktool.Mimikatz.A",
        "last_seen": "5 minutes ago"
    },
    "4a2f8b5c901e23d4f56789abcdef0123456789abcdef0123456789abcdef0123": {
        "type": "hash",
        "threat_score": 99,
        "category": "LockBit 3.0 Ransomware Payload",
        "actor": "LockBit",
        "file_name": "LB3_encrypter.exe",
        "file_type": "PE32 executable (console) Intel 80386",
        "tags": ["ransomware", "lockbit", "crypto-locker", "shadow-copies-deleted"],
        "signature": "Ransom.Win32.Lockbit.SM",
        "last_seen": "Just now"
    }
}

MITRE_TACTICS = [
    {
        "id": "TA0043",
        "name": "Reconnaissance",
        "active_alerts": 4,
        "techniques": [
            {"id": "T1595", "name": "Active Scanning", "severity": "low", "count": 142},
            {"id": "T1592", "name": "Gather Victim Host Info", "severity": "medium", "count": 38}
        ]
    },
    {
        "id": "TA0001",
        "name": "Initial Access",
        "active_alerts": 9,
        "techniques": [
            {"id": "T1190", "name": "Exploit Public-Facing Application", "severity": "critical", "count": 18},
            {"id": "T1566", "name": "Phishing", "severity": "high", "count": 6}
        ]
    },
    {
        "id": "TA0002",
        "name": "Execution",
        "active_alerts": 12,
        "techniques": [
            {"id": "T1059.001", "name": "PowerShell Execution", "severity": "high", "count": 42},
            {"id": "T1204", "name": "User Execution", "severity": "medium", "count": 11}
        ]
    },
    {
        "id": "TA0003",
        "name": "Persistence",
        "active_alerts": 5,
        "techniques": [
            {"id": "T1053", "name": "Scheduled Task / Job", "severity": "high", "count": 8},
            {"id": "T1547", "name": "Boot or Logon Autostart Execution", "severity": "medium", "count": 4}
        ]
    },
    {
        "id": "TA0004",
        "name": "Privilege Escalation",
        "active_alerts": 7,
        "techniques": [
            {"id": "T1068", "name": "Exploitation for Privilege Escalation", "severity": "critical", "count": 5},
            {"id": "T1548", "name": "Abuse Elevation Control Mechanism", "severity": "high", "count": 9}
        ]
    },
    {
        "id": "TA0005",
        "name": "Defense Evasion",
        "active_alerts": 15,
        "techniques": [
            {"id": "T1070", "name": "Indicator Removal on Host", "severity": "critical", "count": 14},
            {"id": "T1027", "name": "Obfuscated Files or Information", "severity": "high", "count": 29},
            {"id": "T1562", "name": "Impair Defenses (Disable AV/EDR)", "severity": "critical", "count": 3}
        ]
    },
    {
        "id": "TA0006",
        "name": "Credential Access",
        "active_alerts": 11,
        "techniques": [
            {"id": "T1003.001", "name": "OS Credential Dumping: LSASS Memory", "severity": "critical", "count": 7},
            {"id": "T1110", "name": "Brute Force", "severity": "medium", "count": 89}
        ]
    },
    {
        "id": "TA0007",
        "name": "Discovery",
        "active_alerts": 6,
        "techniques": [
            {"id": "T1087", "name": "Account Discovery", "severity": "medium", "count": 21},
            {"id": "T1018", "name": "Remote System Discovery", "severity": "low", "count": 45}
        ]
    },
    {
        "id": "TA0008",
        "name": "Lateral Movement",
        "active_alerts": 8,
        "techniques": [
            {"id": "T1021.002", "name": "SMB / Windows Admin Shares", "severity": "critical", "count": 12},
            {"id": "T1550", "name": "Use Alternate Authentication Material", "severity": "high", "count": 4}
        ]
    },
    {
        "id": "TA0011",
        "name": "Command and Control",
        "active_alerts": 14,
        "techniques": [
            {"id": "T1071.001", "name": "Web Protocols C2 (HTTP/HTTPS)", "severity": "high", "count": 67},
            {"id": "T1573", "name": "Encrypted Channel", "severity": "medium", "count": 33}
        ]
    },
    {
        "id": "TA0010",
        "name": "Exfiltration",
        "active_alerts": 3,
        "techniques": [
            {"id": "T1048", "name": "Exfiltration Over Alternative Protocol (DNS)", "severity": "critical", "count": 4},
            {"id": "T1567", "name": "Exfiltration Over Web Service", "severity": "high", "count": 2}
        ]
    },
    {
        "id": "TA0040",
        "name": "Impact",
        "active_alerts": 2,
        "techniques": [
            {"id": "T1486", "name": "Data Encrypted for Impact (Ransomware)", "severity": "critical", "count": 2},
            {"id": "T1490", "name": "Inhibit System Recovery", "severity": "critical", "count": 3}
        ]
    }
]

def lookup_indicator(query: str) -> Dict[str, Any]:
    cleaned = query.strip()
    
    # Check direct IOC match
    if cleaned in KNOWN_IOCS:
        result = dict(KNOWN_IOCS[cleaned])
        result["indicator"] = cleaned
        result["matched"] = True
        return result
        
    # Check CVE match
    cve_upper = cleaned.upper()
    if cve_upper in KNOWN_CVES:
        cve_data = dict(KNOWN_CVES[cve_upper])
        return {
            "indicator": cve_upper,
            "type": "cve",
            "matched": True,
            "threat_score": int(cve_data["cvss"] * 10),
            "category": "Vulnerability / Exploit",
            "details": cve_data
        }

    # Partial/Regex heuristic check
    is_ip = bool(re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", cleaned))
    is_hash = bool(re.match(r"^[a-fA-F0-9]{32,64}$", cleaned))
    is_cve = bool(re.match(r"^CVE-\d{4}-\d+$", cleaned, re.IGNORECASE))
    
    if is_ip:
        # Heuristic scoring for unknown IP
        # Private IP range check
        if cleaned.startswith(("10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.2", "172.3")):
            return {
                "indicator": cleaned,
                "type": "ip",
                "matched": True,
                "threat_score": 15,
                "category": "Internal Corporate Subnet (RFC 1918)",
                "actor": "Internal Asset",
                "country": "Internal Network",
                "tags": ["internal", "rfc1918", "trusted-zone"],
                "last_seen": "Active"
            }
        else:
            return {
                "indicator": cleaned,
                "type": "ip",
                "matched": True,
                "threat_score": 62,
                "category": "External IP / Dynamic Host",
                "actor": "Unclassified External Entity",
                "asn": "AS13335 (Cloudflare/Transit)",
                "country": "United States",
                "tags": ["external-traffic", "scanned-in-honeypots"],
                "last_seen": "Observed 1h ago"
            }
            
    if is_hash:
        return {
            "indicator": cleaned,
            "type": "hash",
            "matched": True,
            "threat_score": 75,
            "category": "Potentially Unwanted Application / Untrusted Binary",
            "file_name": f"sample_{cleaned[:8]}.bin",
            "tags": ["unverified-signer", "heuristics.malware"],
            "last_seen": "Recent sample submission"
        }

    # Domain check
    if "." in cleaned and not cleaned.endswith((".exe", ".dll", ".sh")):
        return {
            "indicator": cleaned,
            "type": "domain",
            "matched": True,
            "threat_score": 78,
            "category": "Suspicious Newly Registered Domain (NRD)",
            "actor": "Possible Phishing Infrastructure",
            "registrar": "NameSilo / Unknown",
            "tags": ["newly-registered", "suspicious-entropy", "ssl-letsencrypt"],
            "last_seen": "Active DNS resolving"
        }

    return {
        "indicator": cleaned,
        "type": "unknown",
        "matched": False,
        "threat_score": 10,
        "category": "No threat intel records found in SIEM cache",
        "tags": ["clean", "not-flagged"]
    }
