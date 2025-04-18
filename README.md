# 🐍 SnakeLink Raspberry

The Raspberry Pi 4B data-collector for the SnakeLink Smart Terrarium System.  
Built with Node.js, it reads live sensor data or mocks them, and sends them to your main server.

## 📦 Features

- ✅ Runs on Raspberry Pi 4B
- ✅ Mock sensor data or real GPIO (planned)
- ✅ Configurable sensors (name, type, unit)
- ✅ Outputs live JSON file
- ✅ WebSocket data broadcast (to connect with main server)
- ✅ Lightweight Express server
- ✅ `/api/sensors` and `/api/config` endpoints

---

## 🧪 Development Setup

```bash
git clone https://github.com/YOUR-USER/snake-link-raspberry.git
cd snake-link-raspberry

npm install
```

Edit your `.env`:

```env
PORT=3000
USE_MOCK=true
```

---

## 🚀 Start in Mock Mode

```bash
npm run start
```

Sensor values will update every 3 seconds and are stored in `./data/liveData.json`.

---

## 🔌 API Endpoints

- `GET /api/sensors` → live data
- `GET /api/config` → sensor config
- (WebSocket support enabled on same port)

---

## 🧩 Planned Features

- Real sensor integration (e.g. DHT22, BME280)
- Water level check
- Camera motion detection → alerts
- Local logging
- WebSocket connection to external server
- Per-animal presets

---

## 📄 License

MIT – for hobby reptiles and hackers 🦎
