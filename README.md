# 🛡️ SENTINEL-X // Enterprise Security Operations Center (SOC) Platform

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployment%20Ready-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MITRE ATT&CK](https://img.shields.io/badge/Framework-MITRE%20ATT%26CK%20v14-red?style=for-the-badge)](https://attack.mitre.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**SENTINEL-X** is an enterprise-grade Security Operations Center (SOC) defense platform and incident response command console. Built with a high-performance **Python FastAPI** backend (supporting both real-time WebSockets and Vercel serverless functions) paired with a reactive, cyber-themed **React + Vite** frontend.

---

## 🌟 Key Platform Modules & Capabilities

### 1. 🚨 Unified Command Center (DEFCON Overview)
- **Dynamic Threat Posture**: Real-time DEFCON 1 through DEFCON 5 status evaluation based on active alerts, ongoing breach attempts, and compromised hosts.
- **Critical SOC Telemetry**: Live Mean Time to Detect (MTTD), Mean Time to Respond (MTTR), 24h Blocked Attacks counter, and real-time Events Per Second (EPS) velocity gauge.
- **Monitored Fleet Status**: Live breakdown of infrastructure health (Healthy, Under Investigation, Compromised, Quarantined).

### 2. 🌍 Interactive Global Threat Map & Ballistic Radar
- **Live Vector Trajectories**: Real-time curved laser arcs tracing hostile attack vectors from global origin nodes (Moscow, Beijing, Amsterdam, Pyongyang, etc.) directly into corporate target gateways.
- **Threat Epicenters**: Pulsing coordinates displaying hostile IP origins, targeting classifications, and port destinations.

### 3. 🔬 Incident Triage, EDR Forensics & Containment
- **Categorized Breach Scenarios**: Ransomware (LockBit 3.0), Cobalt Strike C2, Pass-the-Hash, SQL Injection, Kerberos Spraying, DNS Exfiltration.
- **MITRE ATT&CK Mappings**: Direct technique IDs (e.g. `T1486 Data Encrypted for Impact`, `T1003.001 LSASS Dump`).
- **Interactive EDR Process Trees**: Visual execution hierarchy showing parent processes (`explorer.exe` ➔ `powershell.exe` ➔ `mimikatz.exe` / `LB3_encrypter.exe`).
- **Observable IOC Extraction**: Threat hashes (SHA-256), hostile IPs, command-and-control domains, and file path artifacts with 1-click Threat Intel lookup.
- **Active Remediation Controls**:
  - 🛡️ **Isolate Host**: Instantly applies zero-trust network quarantine to severed host.
  - 🚫 **Block Source IP**: Generates perimeter firewall drop rule.
  - 🛑 **Kill Process Tree**: Simulates remote EDR process tree termination.
  - ✅ **Mark Resolved**: Closes incident and restores asset health.

### 4. 📜 Real-Time SIEM Log & Telemetry Stream
- **Multi-Sensor Ingestion**: Streams logs from Sysmon, Suricata-NIDS, Zeek-DNS, CrowdStrike Falcon EDR, Cloudflare WAF, and Internal Auth services.
- **Precision Controls**:
  - Streaming starts **OFF (Paused)** on load so you can read and inspect logs without disturbance.
  - When turning streaming ON, auto-scroll defaults to **OFF** so the feed never interrupts or yanks your scrollbar.
  - Independent **Auto-Scroll Toggle** and **Bottom** button for 1-click jump to the newest event.
  - Severity level filters (CRITICAL, ERROR, WARN, INFO), sensor filters, keyword search, and JSON export.

### 5. 🖥️ Endpoint Fleet Management & Zero-Trust Isolation
- **Mission-Critical Assets**: Domain Controllers (`DC01-ROOT`), PCI Payment DBs, Ingress Proxies, Finance Workstations, Executive Laptops, and Air-Gapped Backups.
- **Real-Time Health Metrics**: Live CPU and Memory utilization sparklines.
- **1-Click Network Quarantine**: Toggle instant network isolation on any monitored asset.

### 6. 📊 MITRE ATT&CK Matrix Matrix Navigator
- **12 Enterprise Tactics**: Reconnaissance, Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, C2, Exfiltration, Impact.
- **Deep Technique Dossiers**: Event heat-mapping, severity tagging, and mitigation recommendations.

### 7. 🔍 Threat Intelligence & Vulnerability Lookup
- **Multi-Indicator Query**: Search any IP, Domain, SHA-256 hash, or CVE.
- **Threat Dossiers**: Comprehensive profiles on APT29 (Cozy Bear), LockBit 3.0, Lazarus Group, Volt Typhoon, plus critical CVE databases (Log4Shell, MOVEit, PAN-OS, Outlook MonikerLink).

### 8. 🎯 Red Team Attack Simulator Sandbox
- **Simulate Real-World Breaches**:
  - 🔴 **LockBit 3.0 Ransomware**: Canary honeypot trip, shadow copy purge.
  - 🟠 **Pass-the-Hash & PsExec**: Lateral movement from finance workstation to domain controller.
  - 🟣 **Covert DNS Tunneling**: Encoded TXT record exfiltration.
  - 🔵 **Cobalt Strike Beaconing**: Malleable TLS jitter profile.
- Watch DEFCON escalate in real-time and test analyst playbooks!

### 9. 🤖 SOAR Playbooks & Interactive Terminal
- **Incident Playbooks**: Automated step-by-step SOAR execution playbooks for Ransomware Containment, Phishing Response, and DDoS Mitigation.
- **Interactive Cyber Terminal**: Built-in CLI command console accessible via `F2` or `Ctrl + \`` shortcut with custom hacker commands (`help`, `status`, `scan`, `isolate`, `clear`).

---

## 🛠️ Project Structure

```
SOC Dashboard/
├── api/
│   └── index.py                    # Vercel Serverless Function entrypoint (FastAPI)
├── backend/
│   ├── .venv/                      # Python Virtual Environment (local)
│   ├── requirements.txt            # Python dependencies (FastAPI, Pydantic, etc.)
│   ├── models.py                   # Pydantic schemas & data models
│   ├── main.py                     # FastAPI REST API & WebSocket server
│   └── engine/
│       ├── data_store.py           # In-memory SIEM store & telemetry engine
│       ├── simulator.py            # Real-time event & attack simulation
│       └── threat_intel.py         # Threat intelligence & MITRE ATT&CK database
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI components & panels
│   │   ├── services/api.js         # API & WebSocket client with auto-fallback
│   │   ├── index.css               # Cyberpunk SOC Design System & Themes
│   │   ├── App.jsx                 # Master application layout & state
│   │   └── main.jsx
│   ├── package.json                # Frontend dependencies (React 18, Vite, Lucide)
│   └── vite.config.js              # Vite config with API proxy
├── package.json                    # Root build runner for Vercel
├── vercel.json                     # Vercel deployment configuration
├── requirements.txt                # Root Python requirements for Vercel build
├── start.bat                       # 1-Click Windows development launcher
└── README.md                       # Documentation
```

---

## ☁️ Deploying to Vercel (Production)

This project is pre-configured and 100% deployment-ready for **Vercel** with zero extra build configuration needed.

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub** (see instructions below).
2. Go to [vercel.com](https://vercel.com/) and sign in.
3. Click **"Add New..."** ➔ **"Project"**.
4. Import your GitHub repository.
5. Vercel will automatically detect `vercel.json` and configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm --prefix frontend install && npm --prefix frontend run build`
   - **Output Directory**: `frontend/dist`
   - **Functions**: `api/**/*.py` using the Python runtime
6. Click **Deploy**. In under a minute, your SOC platform is live on the web!

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI if not installed
npm install -g vercel

# Run deployment from the project root
vercel
```

> **Note on WebSockets in Serverless Environments**:  
> Vercel Serverless functions run on ephemeral stateless HTTP requests. The frontend is built with an automatic graceful fallback: if a persistent WebSocket is not present, it automatically polls telemetry and health metrics every 5 seconds, keeping the dashboard dynamic and fully functional in cloud environments.

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v18 or newer
- **Python**: 3.10, 3.11, or 3.12

### Option A: 1-Click Launch (Windows)
Double-click `start.bat` in the project root directory. Both the backend and frontend dev servers will launch in separate terminal windows.

### Option B: Manual Launch

#### 1. Setup & Start Backend:
```bash
cd backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```
- API Docs (Swagger UI): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

#### 2. Setup & Start Frontend:
```bash
cd frontend
npm install
npm run dev
```
- Frontend Application: [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Environment Variables (Optional)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE` | Base URL for REST API endpoints (set if hosting backend on an external server like Railway or Render) | `""` (relative path) |
| `VITE_WS_BASE` | WebSocket URL for live telemetry stream | `ws://localhost:8000/ws/live` in dev, `wss://<host>/ws/live` in prod |

---

## 📜 License
This project is open-source under the [MIT License](LICENSE).
