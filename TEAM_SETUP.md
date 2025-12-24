
# Team Setup Guide

## Scenario A: Accessing the App (No Setup Required)
If you just want to use the app that is running on the Host Machine:
- **Frontend URL**: http://192.168.1.72:5173
- **Backend API**: http://192.168.1.72:8001
- **Database**: 192.168.1.72:5432

## Scenario B: Frontend Developer (No Backend Required)
If you only work on the UI/React code:
1. You **DO NOT** need to run Python, Docker, or the Backend.
2. Create a `.env` file in the root directory.
3. Add this line to point to the Host's backend:
   ```ini
   VITE_API_URL=http://192.168.1.72:8001
   ```
4. Run `npm install` and `npm run dev`.

## Scenario C: Backend Developer (Shared Database)
If you work on Python/Django code but want to share the team database:
1. Update `backend/.env` to point to the Host's database:
   ```ini
   DB_NAME=eit_crm
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=192.168.1.72
   DB_PORT=5432
   ```
2. Run `python manage.py runserver`.

## Scenario D: Running Full Stack with Docker (Isolated DB)
If you want a completely separate environment (your own database):
1. Run `docker-compose up --build`.
2. This creates a local database, backend, and frontend.
3. App will be at `http://localhost:5173`.

---

## 🛠️ Database Connection Details
Use these credentials to connect via **pgAdmin**, **DBeaver**, or **TablePlus**:

| Setting | Value |
|---------|-------|
| **Host** | `192.168.1.72` |
| **Port** | `5432` |
| **Database** | `eit_crm` |
| **Username** | `postgres` |
| **Password** | `postgres` |

> **Note:** If connection fails, ask the Host to run the "Allow Database Access" firewall rule below.

---

## Host Machine Setup (For the Host Only - 192.168.1.72)

To allow the team to connect, you must open ports in Windows Firewall.

**Run this command in PowerShell as Administrator:**
```powershell
# Allow Database Access
New-NetFirewallRule -DisplayName "PostgreSQL Remote Access" -Direction Inbound -LocalPort 5432 -Protocol TCP -Action Allow

# Allow Backend API Access
New-NetFirewallRule -DisplayName "Django Backend Access" -Direction Inbound -LocalPort 8001 -Protocol TCP -Action Allow

# Allow Frontend Access
New-NetFirewallRule -DisplayName "Vite Frontend Access" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```
