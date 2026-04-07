# 🐍 SnakeLink Raspberry

A modular TypeScript backend for Raspberry Pi 4B to monitor, simulate and control smart terrarium sensors.  
Part of the **Cold-Blood-Cast ecosystem**, this project handles local data collection, WebSocket broadcasting, REST APIs, user authentication, and optional remote forwarding.

> Built with 💚 Express, TypeScript, WebSockets, and GPIO sensor support.

---

## 📦 Features

- ✅ Runs on Raspberry Pi 4B or compatible Node.js systems
- ✅ Real and mock sensor support (DHT22, BME280)
- ✅ File-based data storage (JSON)
- ✅ Secure JWT-based authentication
- ✅ Role- and permission-based access control
- ✅ WebSocket broadcasting of live data
- ✅ REST API for config, logs, and live data
- ✅ Modular, extendable architecture

---

## 📁 Project Structure

```
snake-link-raspberry/
├── src/                  # Source code
│   ├── routes/           # API routes
│   ├── reader/           # GPIO readers
│   ├── services/         # Polling, logging
│   ├── logger/           # Sensor logging
│   ├── middlewares/      # Auth middleware
│   ├── utils/            # Helper logic
├── data/                 # Persistent config/log files
├── .env                  # Configurable environment
├── tsconfig.json         # TypeScript config
└── README.md
```

---

## 🧪 Development Setup

### 1. Clone & Install

```bash
git clone https://github.com/your-user/snake-link-raspberry.git
cd snake-link-raspberry
npm install
```

### 2. Set Up `.env`

```env
# Port for the HTTP server
PORT=3000
# Use mock data instead of real data
# Set to true for development/testing purposes
# Set to false for production
USE_MOCK=true
# Base directory for data storage
DATA_DIR=./data
# Comma‑separated list of allowed CORS origins, or "*" for any
CORS_ORIGINS=*
# JWT secret for signing tokens
JWT_SECRET=your_jwt_secret_here
# Pepper for hashing passwords
PEPPER=your_pepper_here
```

---

## 🔐 Auth System

- Register requires a one-time key
- JWT token returned on login
- Authenticated endpoints require bearer token
- Admins can create new registration keys

---

## 🔌 Sensor Support

### DHT22 (AM2302)

- Connect via GPIO pin
- Measures temperature and humidity

### BME280

- Connect via I2C (bus 1)
- Measures temperature, humidity, pressure

> You can mix & match sensor types, or use mock sensors for testing.

---

## 🔧 REST API Overview

[Swagger Doku](http://localhost:3000/api/docs)

---

## 📡 WebSocket

The server broadcasts real-time sensor updates via WebSocket.  
Clients (e.g., frontend dashboard) can subscribe for instant data sync.

---

## 🧠 Data Files

All data is stored in `/data/` as editable JSON files:

- `users.json` – Registered users
- `sensor.config.json` – Sensor configuration
- `liveData.json` – Last read values
- `sensorLogs.json` – Time-series sensor logs
- `app.config.json` – Global settings
- `registration.keys.json` – One-time register keys

---

## 🛡️ Security Tips

- Keep `.env` private
- Choose secure `JWT_SECRET` and `PEPPER` secrets
- Remove unused registration keys
- Use HTTPS when accessed over network

---

## 🧩 Roadmap

- CSV log export
- Remote sync via WebSocket
- Webcam support
- Alert system
- Water pump integration
- Multi-user control panel

---

## 🤝 Contribution

Feel free to fork, build, and extend SnakeLink.  
Feedback, issues and pull requests are welcome.

---

## 📄 License

MIT – for reptile geeks and code freaks 💻🦎
