
# 🌿 Smart Terrarium Monitoring System (Node.js + Nuxt 3)

A lightweight, stable and extendable DIY smart monitoring system for a corn snake terrarium.  
Built with a Node.js backend and a Nuxt 3 frontend for real-time local display and data visualization.

This project is designed to run on a **Raspberry Pi 4B**, but can also be developed and tested **locally with mocked endpoints**.

---

## 🧠 Project Goals

- ✅ Offline-first & Raspberry Pi-ready
- ✅ Live temperature & humidity monitoring
- ✅ Modern UI built with Nuxt 3 & TailwindCSS
- ✅ Extendable (camera, notifications, automation)
- ✅ Minimal dependencies, no Docker required
- ✅ Optional SurrealDB support for logging & querying

---

## 📦 Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js (Express) |
| Frontend | Nuxt 3 |
| Data Source | JSON file or SurrealDB |
| Styling | Tailwind CSS |
| Charts | Chart.js or ECharts |
| Deployment | systemd / PM2 (no Docker needed) |

---

## 📁 Project Structure (planned)

```
project-root/
├── snake-link-raspbery/
│   ├── data/
│   │   └── values.json           # Live sensor data (mock or real)
│   ├── routes/
│   │   └── api.js                # API endpoints
│   ├── mock/
│   │   └── mockData.js           # Optional fake/mock data
│   └── index.js                  # Express server
├── frontend/
│   └── (Nuxt 3 project here)     # Live dashboard
├── README.md
```

---

## 🧪 Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/smart-terrarium.git
cd smart-terrarium
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Run in development mode (mocked data)

```bash
# Backend
cd backend
npm run dev:mock

# Frontend (Nuxt 3)
cd ../frontend
npm run dev
```

---

## 🔌 Sensor Data Flow

- Real values will be read from GPIO sensors (DHT22, BME280) on the Pi.
- During development, mocked values will be injected for seamless testing.

You can switch between mock mode and real mode via ENV variable or CLI flag.

---

## 🎨 Frontend Features (Nuxt 3)

- 🌡️ Live display: temperature & humidity
- 📈 Chart: min/max trends
- 🌘 Dark mode + responsive layout
- 📷 (Planned) Embedded Pi Camera stream
- 🔔 (Planned) Telegram/Discord alert integration

---

## 🧩 Optional Features

- SurrealDB support (fast, modern embedded DB)
- Smart plug control (via API)
- Cron-based logging (daily CSV/JSON exports)
- Multiple terrarium support

---

## 🚀 Deployment (Raspberry Pi)

```bash
# Install PM2 (optional)
npm install pm2 -g

# Start backend
cd backend
pm2 start index.js --name backend

# Start frontend (build first)
cd ../frontend
npm run build
npm run preview
```

You can also create `systemd.service` files for fully native Pi deployment.

---

## 🤝 Contributing

Feel free to fork, improve and send PRs. This is a hobbyist project to help reptile lovers get more control over their enclosures 🦎

---

## 📄 License

MIT – Do whatever you want, but don't sue me if your lizard becomes self-aware 😄
