# 🐍 SnakeLink Raspberry

A modular TypeScript backend for Raspberry Pi 4B to monitor and simulate smart terrarium sensor data.  
This project is part of the **SnakeLink ecosystem** and is designed to collect data locally, broadcast it via WebSocket, and optionally forward it to a remote server.

> Built with 💚 Express, TypeScript, WebSockets, and future GPIO support.

---

## 📦 Features

- ✅ Runs on Raspberry Pi 4B or any Node.js-compatible machine
- ✅ Modular TypeScript architecture
- ✅ Mock sensor generation for development
- ✅ Configurable sensor types and limits
- ✅ File-based data store (readable & editable)
- ✅ WebSocket broadcasting for live dashboards
- ✅ REST API endpoints for current config & sensor data

---

## 🧠 Sensor Types & Units

| Type        | Units          |
|-------------|----------------|
| temperature | `°C`, `°F`     |
| humidity    | `%`            |
| water       | `present`, `ml`|

Each sensor can define `min`, `max`, and `active` flags for later alerting or UI logic.

---

## 📁 Project Structure

```
snake-link-raspberry/
├── src/
│   ├── index.ts                  # Main entry (starts everything)
│   ├── types/                    # Type definitions
│   │   └── sensor.ts
│   ├── mock/
│   │   └── mockLoop.ts           # Mock sensor simulation
│   ├── utils/
│   │   └── broadcast.ts          # WebSocket broadcast logic
│   └── storage/
│       └── dataStorageService.ts# File-based storage manager
├── data/
│   └── liveData.json             # Live sensor values (auto-created)
├── config/
│   └── sensors.config.json       # Configurable sensor definitions
├── .env                          # ENV variables (e.g. USE_MOCK)
├── package.json
└── README.md
```

---

## ⚙️ Setup

### 1. Clone the project

```bash
git clone https://github.com/your-user/snake-link-raspberry.git
cd snake-link-raspberry
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure `.env`

```env
PORT=3000
USE_MOCK=true
```

---

## 🧪 Run in Dev Mode

```bash
npm run dev
```

This starts the server on the specified port and simulates sensor data based on your `sensors.config.json`.

---

## 🔌 REST Endpoints

| Endpoint         | Description                |
|------------------|----------------------------|
| `/api/sensors`   | Returns current sensor data |
| `/api/config`    | Returns sensor config       |

---

## 📡 WebSocket

The server broadcasts live sensor data to all connected WebSocket clients.  
You can use this to stream updates to a dashboard, forward to the cloud, or trigger automation.

---

## 🧩 Planned Features

- GPIO sensor support (DHT22, BME280, etc.)
- Remote server sync (via WebSocket or REST)
- Sensor logging (CSV/JSON exports)
- Alerting system (threshold + notification logic)
- Camera & motion detection (PiCam)
- Multi-terrarium support

---

## 🤝 Contribution

This is a hobby-first project. Fork it, break it, fix it, or just use it to monitor your snake 🐍

---

## 📄 License

MIT – for reptile geeks and code freaks 💻🦎
