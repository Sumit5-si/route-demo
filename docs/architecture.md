# EVoyage AI — System Architecture & API Reference

## 1. Directory Structure

```
d:/hackathons/sgsits/
├── docs/                        # Project Documentation
│   ├── README.md                # Documentation index & quickstart
│   ├── problem_statement.md     # Problem statement & vision
│   ├── implementation_plan.md   # Mathematical models & roadmap
│   ├── architecture.md          # Architecture & API reference
│   └── hackathon_demo_guide.md  # Presentation & demo script
├── backend/                     # FastAPI Backend Server
│   ├── app/
│   │   ├── main.py              # Application entrypoint & WebSocket routes
│   │   ├── config.py            # Environment configuration
│   │   ├── database/            # Supabase & LocalStore offline data
│   │   ├── engine/              # Battery model, decision engine, multi-EV balancer
│   │   ├── simulation/          # Event simulator & WebSocket manager
│   │   └── routers/             # REST API endpoints
│   ├── requirements.txt
│   └── run.py
└── frontend/                    # React + Vite + Tailwind PWA
    ├── public/                  # PWA manifest & Service Worker
    ├── src/
    │   ├── components/          # Map, Route, Battery, Multi-EV, Onboarding
    │   ├── context/             # Vehicle, Trip, Demo contexts
    │   ├── services/            # Axios API & WebSocket clients
    │   └── types/               # TypeScript schemas
    ├── tailwind.config.js       # Official brand palette tokens
    └── package.json
```

---

## 2. REST & WebSocket API Endpoints

### 2.1 REST Endpoints (`/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/vehicles` | List user vehicles with battery specs & SOH |
| `POST` | `/api/v1/vehicles` | Register new EV profile with purchase date & degradation |
| `GET` | `/api/v1/stations` | List charging stations along selected corridor |
| `POST` | `/api/v1/trips/plan` | Calculate multi-factor optimal route and charging stops |
| `POST` | `/api/v1/trips/{id}/replan` | Recalculate route when event or outage occurs |
| `POST` | `/api/v1/simulation/events` | Inject station congestion, outage, traffic, or battery drain |
| `POST` | `/api/v1/multi-ev/simulate` | Run 5–6 vehicle corridor fleet coordination simulation |
| `GET` | `/api/v1/history` | Retrieve past completed trips log |

### 2.2 WebSocket Endpoints

| Endpoint | Description |
| :--- | :--- |
| `ws://127.0.0.1:8000/ws/trips/{trip_id}` | Real-time live trip updates, GPS telemetry, and automatic re-planning alerts |
| `ws://127.0.0.1:8000/ws/live` | Global station availability and congestion event stream |
