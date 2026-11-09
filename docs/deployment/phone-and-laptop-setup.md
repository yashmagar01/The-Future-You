# Running the Node Backend on Phone or Laptop

**Service:** `backend/local-processor/`
**Goal:** the same code runs on an Android phone (Termux) or a laptop (Windows/Linux/macOS). Only `.env` values differ.

The background queue must stay **disabled** on both machines until job claiming is implemented. Keep `ENABLE_QUEUE=false`.

---

## 0. Common prerequisites

- Node.js **18 or newer** (the queue path uses global `fetch`).
- **pnpm** (the backend lockfile is `pnpm-lock.yaml`).
- FFmpeg and Python are **not required** to run the Express API. They are only used by the background AI queue, which is disabled.
- A Supabase project URL and **service role** key.

Do not run `npm install` in `backend/local-processor/`; it creates a competing lockfile. Use `pnpm install`.

---

## 1. Environment file

From `backend/local-processor/`, create `.env` (copy the example, then edit):

```bash
cp .env.example .env
```

The server always reads **this directory's** `.env`, no matter where you launch it from.

Minimum contents:

```dotenv
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVICE-ROLE-KEY

HOST=0.0.0.0
PORT=3001
ENABLE_QUEUE=false
```

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `SUPABASE_URL` | yes | — | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | — | Server-side Supabase key (bypasses RLS; keep secret) |
| `GEMINI_API_KEY` | no | empty | `/api/chat` uses Gemini; without it it returns a local fallback |
| `HOST` | no | `0.0.0.0` | `127.0.0.1` = this machine only; `0.0.0.0` = reachable on the LAN |
| `PORT` | no | `3001` | HTTP port |
| `NODE_ENV` | no | `development` | Logged only |
| `CORS_ORIGINS` | no | empty (= allow all) | Comma-separated allowlist, e.g. `https://your-app.vercel.app` |
| `TMP_DIR` | no | `tmp` | Relative to the service dir; absolute paths accepted |
| `UPLOADS_DIR` | no | `uploads` | Same |
| `ENABLE_QUEUE` | no | `false` | **Leave false.** Only `true` starts the background worker |
| `PYTHON_BIN` | no | `python` on Windows, `python3` elsewhere | Used only by the queue |
| `PYTHON_TIMEOUT_MS` | no | `900000` (15 min) | Queue child-process timeout |

Never commit `.env`.

---

## 2. Android / Termux

```bash
pkg update && pkg upgrade
pkg install nodejs git
# Optional, only for the future AI queue:
pkg install python ffmpeg

# pnpm (corepack may not work on Termux; npm install is fine for the tool itself)
npm install -g pnpm

cd ~/The-Future-You/backend/local-processor   # adjust if your clone has another name
pnpm install
cp .env.example .env
nano .env          # set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HOST, PORT, ENABLE_QUEUE=false

node server.js
```

Expected logs:

```text
Background worker disabled (ENABLE_QUEUE is not true).
Local processor listening at http://0.0.0.0:3001
Background queue: disabled
```

Check health **on the phone**:

```bash
curl -i http://localhost:3001/
```

Expected: `HTTP/1.1 200 OK` and `Local Processor is running!`.

Automated smoke test (startup, health, queue-disabled check, graceful shutdown):

```bash
sh scripts/termux-smoke-test.sh
```

It uses port `3999` by default (`PORT=4000 sh scripts/termux-smoke-test.sh` to change), prints the startup log, and ends with `RESULT: PASS` or `RESULT: FAIL`. It never starts the queue.

Keep the phone awake (optional):

```bash
termux-wake-lock
```

Disable battery optimisation for Termux in Android settings, otherwise Android may kill the process.

Find the phone's Wi-Fi IP:

```bash
ip addr show wlan0 | grep 'inet '
# or
ifconfig wlan0
```

---

## 3. Windows (PowerShell)

Install tools (one-time):

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
# Optional, queue only:
winget install Gyan.FFmpeg

corepack enable
# If pnpm is still missing:
npm install -g pnpm
```

Prepare and start:

```powershell
cd backend\local-processor
pnpm install
Copy-Item .env.example .env
notepad .env      # set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, HOST, PORT, ENABLE_QUEUE=false

node server.js
```

Health check:

```powershell
Invoke-WebRequest http://localhost:3001/ -UseBasicParsing |
  Select-Object StatusCode, Content
```

Find the laptop's Wi-Fi IPv4 address:

```powershell
ipconfig
# look for "IPv4 Address" under the Wi-Fi adapter
```

Allow LAN access (only if you intentionally want it; run PowerShell as Administrator):

```powershell
New-NetFirewallRule -DisplayName "Future You Node API" `
  -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

Stop: press `Ctrl+C`. If it is stuck:

```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen |
  Select-Object -ExpandProperty OwningProcess |
  ForEach-Object { Stop-Process -Id $_ }
```

---

## 4. Linux

Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y nodejs npm git
# Optional, queue only:
sudo apt install -y ffmpeg python3 python3-pip

sudo npm install -g pnpm
# or: sudo corepack enable

cd backend/local-processor
pnpm install
cp .env.example .env
nano .env          # set values
node server.js
```

Find the LAN IP:

```bash
hostname -I
# or: ip -4 addr show
```

Allow the port (only if needed):

```bash
sudo ufw allow 3001/tcp
```

Health:

```bash
curl -i http://localhost:3001/
```

Stop: `Ctrl+C`, or:

```bash
pkill -f "node server.js"
```

---

## 5. macOS

```bash
brew install node git pnpm
# Optional, queue only:
brew install ffmpeg python

cd backend/local-processor
pnpm install
cp .env.example .env
nano .env
node server.js
```

Find the LAN IP:

```bash
ipconfig getifaddr en0     # Wi-Fi
```

Health:

```bash
curl -i http://localhost:3001/
```

Stop: `Ctrl+C`, or:

```bash
pkill -f "node server.js"
```

Allow incoming connections for `node` in **System Settings → Network → Firewall** if LAN access is needed.

---

## 6. Running from the repository root

Use the existing root script; it sets the working directory correctly:

```bash
npm run backend
```

On Termux/Linux/macOS you can also run:

```bash
node backend/local-processor/server.js
```

Either works now because `.env` is resolved relative to the service directory. Do **not** expect shell-exported variables to be overridden by `.env`: existing process environment variables win, which is standard `dotenv` behaviour.

---

## 7. Access from another device on the same Wi-Fi

1. On the host, set `HOST=0.0.0.0` and note the port (`PORT=3001`).
2. Allow TCP `3001` in the host firewall.
3. Make sure both devices are on the same network and that client isolation / guest Wi-Fi is off.
4. From the other device:

   ```bash
   curl -i http://<HOST-LAN-IP>:3001/
   ```

   Browser: `http://<HOST-LAN-IP>:3001/`

5. Point the frontend at it:

   ```dotenv
   VITE_LOCAL_PROCESSOR_URL=http://<HOST-LAN-IP>:3001
   ```

   and restart the Vite dev server (or rebuild/redeploy the frontend).

**Warning:** the API currently has no authentication. Anyone on the same network who can reach the port can call it. Use `HOST=127.0.0.1` unless LAN access is actively needed, and do not forward the port on your router.

---

## 8. Health, stop, restart

Health endpoint (both devices):

```bash
curl -i http://localhost:3001/
```

A healthy response is HTTP 200 with `Local Processor is running!`.

Stop:

- Foreground: `Ctrl+C` (graceful: closes the HTTP server, kills tracked Python children).
- Termux: `Ctrl+C`, close the session, or `pkill -f "node server.js"`.
- Windows: `Ctrl+C`, or the `Get-NetTCPConnection` snippet above.
- Linux/macOS: `Ctrl+C` or `pkill -f "node server.js"`.

Restart: run the same `node server.js` command again. Nothing persists in the service except `.env`, `tmp/`, `uploads/`, and `logs/`.

Port already in use:

```text
Port 3001 is already in use. Set PORT to a free port.
```

Change `PORT` in `.env`, or stop the other process.

---

## 9. What is intentionally not configured

- `ENABLE_QUEUE=true` — do not enable it. Two machines polling Supabase today can process the same job twice.
- Python AI engine / Whisper.cpp / MediaPipe / Transformers.js models — not needed for the API and not verified on Android.
- Public tunnels (ngrok, Cloudflare Tunnel, etc.) — do not expose this unauthenticated service publicly.
- PM2/systemd service units — not added; start it in the foreground for now.
