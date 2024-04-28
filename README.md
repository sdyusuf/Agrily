# Agrily — Digital Agricultural Marketplace & Logistics Platform

[![Agrily CI](https://github.com/sdyusuf/Agrily/actions/workflows/ci.yml/badge.svg)](https://github.com/sdyusuf/Agrily/actions/workflows/ci.yml)
[![Docker Ready](https://img.shields.io/badge/Docker-Compose%20v3.8-2496ED?logo=docker&logoColor=white)](docker-compose.yml)
[![Node Version](https://img.shields.io/badge/Node.js-18%20%7C%2020-339933?logo=node.js&logoColor=white)](backend/package.json)
[![React Version](https://img.shields.io/badge/React-17.0.2-61DAFB?logo=react&logoColor=black)](frontend/package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Agrily is a modern digital agricultural commerce and supply chain management platform designed for rural smallholder farmers, agrarian cooperatives, and commercial food processors. Agrily eliminates predatory middlemen by connecting farmers directly with bulk commodity buyers through transparent pricing, verified trust badges, real-time order tracking, and escrow settlement safeguards.

---

## 🌾 Platform Highlights

- **Agricultural Marketplace:** Filter and search fresh produce by standardized taxonomy categories (`grains`, `tubers`, `fruits`, `vegetables`, `livestock`, `poultry`, `dairy`, `oilseeds`), price sliders, and measurement units (`kg`, `bag`, `ton`, `crate`).
- **Farmer Inventory Management:** Farmers can register harvest stock, define minimum order thresholds, upload produce photography, and track inventory levels.
- **Farmer Identity & Trust Badges:** Rich farmer profiles with geographic farm coordinates, acreage sizing, verified producer badges, and trust scoring based on historical fulfillment.
- **Order Pipeline & Notifications:** Real-time procurement cart, multi-farmer checkout, order status lifecycle tracking (`pending` -> `confirmed` -> `dispatched` -> `in_transit` -> `delivered` -> `settled`), and automated transactional email dispatch.
- **Financial Analytics & Revenue Tracking:** Real-time dashboards summarizing gross sales, pending escrow reserves, delivered revenue, and crop volume breakdowns.
- **Enterprise-Grade Security:** OWASP Helmet headers, rate-limiting on authentication gates, Joi request payload validation, and recursive NoSQL injection sanitization.
- **Containerized Cloud Deployment:** Multi-stage Docker packaging, Docker Compose service orchestration, and automated GitHub Actions CI pipeline.

---

## 🚀 Quickstart with Docker Compose

The fastest way to run the entire Agrily platform (MongoDB, Node.js API, and Nginx Web Client) is using Docker Compose:

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v24.0 or newer)
- Docker Compose (v2.20 or newer)

### 2. Launch All Services
```bash
# Clone the repository
git clone https://github.com/sdyusuf/Agrily.git
cd Agrily

# Spin up MongoDB, API backend, and frontend web server in background mode
docker compose up -d --build
```

### 3. Verify Container Status
```bash
docker compose ps
```

| Service | Container Name | Port Mapping | Health Probe Endpoint |
|---|---|---|---|
| Frontend Web | `agrily-frontend` | `http://localhost:80` (or `:3000`) | `GET /` |
| REST API | `agrily-backend` | `http://localhost:5000` | `GET /api/categories` |
| Database | `agrily-mongo` | `localhost:27017` | `mongosh adminCommand(ping)` |

### 4. Stop Services
```bash
# Gracefully stop containers and networks
docker compose down

# To reset database storage volumes as well:
docker compose down -v
```

---

## 💻 Local Development Setup

To develop locally without Docker:

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables (create .env file)
# MONGO_URI=mongodb://localhost:27017/agrily
# JWT_SECRET=your_jwt_secret_key_here
# PORT=5000

# Start server with Nodemon live-reloading
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development dev-server with OpenSSL legacy support
npm start
```
The React application will open automatically at `http://localhost:3000`.

---

## 🧪 Comprehensive Automated Testing

Agrily maintains a 100% test passing baseline across all backend and frontend services.

### Run Backend Integration & Unit Tests (17 Suites)
```bash
cd backend
npm test
```
*Executes unit and integration tests across Mongoose models, Joi request validators, Supertest auth & products routes, order state machines, farmer analytics, driver and fleet routes, branded email templates, security headers, and NoSQL injection sanitization.*

### Run Frontend React Testing Library Tests (28 Suites)
```bash
cd frontend
npm test -- --watchAll=false --maxWorkers=2
```
*Executes component tests across Navigation, Home, Marketplace, Checkout, Driver Registration, Driver Dashboard, Farm Profile Editor, Notification Center, Cart Drawer, Debounced Search, and Verified Trust Badges.*

---

## 🛡️ Security & Responsible Disclosure

- **Report Vulnerabilities:** Send vulnerability reports directly to `security@agrily.com`.
- **JWT Security:** Tokens are cryptographically validated on every protected mutation.
- **Input Sanitization:** All payload inputs are sanitized against NoSQL injection vectors.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
