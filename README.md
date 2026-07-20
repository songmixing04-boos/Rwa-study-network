# RWA Study Network

A fully rebranded proxy portal for RWA Study Network — streams lectures, PDFs, and courses with custom branding.

## 🚀 One-Click Deploy on Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

## 🛠️ Manual Deploy (Railway)

1. **Fork / push this repo to GitHub**
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
3. Select this repository
4. Add the environment variable:
   ```
   SESSION_SECRET=any_random_secret_string_here
   ```
5. Railway auto-detects `railway.toml` and deploys

Your app will be live at: `https://<your-app>.up.railway.app`

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Auto (Railway sets it) | Server port |
| `SESSION_SECRET` | Yes | Random secret for sessions |
| `NODE_ENV` | Optional | Set to `production` |

---

## 🏗️ Tech Stack

- **Backend:** Express.js 5 (Node.js) — proxy server
- **Frontend:** React + Vite — iframe shell
- **Monorepo:** pnpm workspaces

## 📁 Project Structure

```
artifacts/
  api-server/     ← Express proxy server (main backend)
  rwa-proxy/      ← React frontend (Vite)
packages/         ← Shared packages
```

## 🔧 Local Development

```bash
# Install dependencies
pnpm install

# Start API server (port 3000)
pnpm --filter @workspace/api-server run dev

# Start frontend (port 5173)
pnpm --filter @workspace/rwa-proxy run dev
```

---

**Developed by 🌺⃞⃪꯭𝓐𝓷𝓴𝓲𝓽 𝓒𝓱𝓪𝓾𝓭𝓱𝓪𝓻𝔂🦅**
