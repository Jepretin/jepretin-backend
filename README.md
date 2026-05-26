<p align="center">
  <img src="assets/logo.jpeg" alt="Jepretin" width="200">
</p>

<h1 align="center">Jepretin Backend</h1>

<p align="center">
  Marketplace jasa fotografi, videografi &amp; MUA berbasis lokasi<br>
  <em>Location-based photography, videography &amp; MUA marketplace</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-20-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node 20">
  <img src="https://img.shields.io/badge/express-5-000000?style=flat-square&logo=express&logoColor=white" alt="Express 5">
  <img src="https://img.shields.io/badge/prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma 5">
  <img src="https://img.shields.io/badge/postgresql-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 16">
  <img src="https://img.shields.io/badge/jwt-auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" alt="JWT Auth">
  <img src="https://img.shields.io/badge/swagger-docs-85EA2D?style=flat-square&logo=swagger&logoColor=black" alt="Swagger Docs">
  <img src="https://img.shields.io/badge/jest-32%2F38%20pass-C21325?style=flat-square&logo=jest&logoColor=white" alt="JEST Tests">
  <img src="https://img.shields.io/badge/docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker Ready">
</p>

---

## 📖 Tentang / About

**Jepretin** adalah platform yang menghubungkan customer dengan penyedia jasa visual profesional di sekitar mereka. Cari fotografer, videografer, atau MUA lokal dalam hitungan detik.

**Jepretin** is a platform connecting customers with professional visual service providers nearby. Find local photographers, videographers, or MUAs in seconds.

> 🎯 **Core philosophy:** _"Mencari fotografer lokal dengan cepat." — "Find local photographers fast."_

---

## 🧱 Tech Stack

| Layer      | Teknologi                  |
| ---------- | -------------------------- |
| Runtime    | Node.js 20                 |
| Framework  | Express.js 5               |
| ORM        | Prisma 5                   |
| Database   | PostgreSQL 16              |
| Auth       | JWT + bcrypt + OTP (email) |
| Validation | Joi                        |
| Payment    | Midtrans Snap (redirect)   |
| Upload     | ImageKit + Multer          |
| Email      | Nodemailer (Gmail)         |
| Docs       | Swagger UI (OpenAPI 3.0.3) |
| Container  | Docker + docker-compose    |
| Testing    | JEST + Supertest           |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Git

### 1. Clone & Install

```bash
git clone https://github.com/Jepretin/jepretin-backend.git
cd jepretin-backend
npm install
```

### 2. Environment Variables

Buat file **`.env`** dari template di bawah:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/jepretin
JWT_SECRET=your-super-secret-key-change-this
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false
IMAGEKIT_PUBLIC_KEY=your-imagekit-public
IMAGEKIT_PRIVATE_KEY=your-imagekit-private
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your-id
PORT=3000
FRONTEND_RESET_PASSWORD_URL=http://localhost:3000/reset-password
```

### 3. Database Setup

```bash
# Jalankan semua migration
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Seed Data

```bash
# Seed reference data + demo users & orders
npm run prisma:seed

# (Optional) Fetch full Indonesia wilayah data — takes 5-10 minutes
node prisma/seed-wilayah.js
```

### 5. Start Server

```bash
npm start
# Server running at http://localhost:3000
# Swagger docs at http://localhost:3000/api-docs
```

---

## 🐳 Docker

```bash
# Build & run app + PostgreSQL sekaligus
docker-compose up -d

# App auto-migrates on startup
# Access at http://localhost:3000
```

---

## 🔑 Demo Accounts

| Email                | Role                                   | Password      |
| -------------------- | -------------------------------------- | ------------- |
| `admin@jepretin.com` | Admin                                  | `password123` |
| `rina@jepretin.com`  | Customer                               | `password123` |
| `budi@jepretin.com`  | Customer                               | `password123` |
| `andi@jepretin.com`  | Provider (Photographer + Videographer) | `password123` |
| `sari@jepretin.com`  | Provider (MUA)                         | `password123` |

---

## 🧪 Testing

```bash
# Jalankan semua test suites
npm test
```

| Suite         | Tests | Coverage                                                             |
| ------------- | :---: | -------------------------------------------------------------------- |
| Auth flow     |   9   | Register, login, logout, OTP, forgot/reset password                  |
| Critical path |   6   | Order create, status transitions, payment, wallet                    |
| Webhook       |   5   | Midtrans settlement, cancel, deny, invalid sig, non-existent         |
| Integration   |  18   | Withdrawal, review, notification, like, availability, template, role |

---

## 📚 API Documentation

Swagger UI tersedia di endpoint:

```
http://localhost:3000/api-docs          # Local
https://jepretin-backend-production.up.railway.app/api-docs/       # Production
```

| Metric                  | Count |
| ----------------------- | :---: |
| Tags                    |  19   |
| Paths (endpoint groups) |  84   |
| Schemas                 |  74   |
| Total endpoints         | ~100  |

---

## 📁 Project Structure

```
src/
├── docs/swagger.json           # OpenAPI 3.0.3 documentation
├── libs/nodemailer.js          # Nodemailer singleton
├── middlewares/                 # Auth, validation, upload
├── modules/
│   ├── auth/                   # Register, login, logout, OTP, password (7 ep)
│   ├── user/                   # User CRUD + address CRUD (9 ep)
│   ├── wilayah/                # Province, regency, district, village (4 ep)
│   ├── provider/               # Core + role + coverage + portfolio + bundle + topping + availability (39 ep)
│   ├── order/                  # Order CRUD + status transitions (6 ep)
│   ├── payment/                # Midtrans Snap + webhook + category + method (12 ep)
│   ├── wallet/                 # Provider wallet balance (2 ep)
│   ├── withdrawal/             # Withdrawal request + approve/reject (6 ep)
│   ├── review/                 # Customer review + rating (7 ep)
│   ├── notification/           # Notification list + read + template CRUD (9 ep)
│   └── like/                   # Like toggle + count + my-likes (3 ep)
├── routes/route.js             # Route aggregator
├── services/                   # Prisma & ImageKit singletons
└── utils/                      # AppError, handleAsync, response helpers
```

---

## 🔄 Order Lifecycle

```
PENDING ──(customer cancel)──→ CANCELLED
PENDING ──(Midtrans webhook)──→ PAID
PAID ──(provider accept)──────→ IN_PROGRESS
IN_PROGRESS ──(provider done)─→ WAITING_CONFIRMATION
WAITING_CONFIRMATION ──(cust)─→ COMPLETED
ADMIN: override any status
```

Wallet provider dikredit **setelah order COMPLETED** — bukan setelah payment success (anti-fraud).

---

## 🌐 Production Deployment

```bash
# 1. Set production environment variables
export MIDTRANS_IS_PRODUCTION=true
export JWT_SECRET=your-production-secret
# ... (all other env vars)

# 2. Deploy with Docker Compose
docker-compose up -d

# 3. Seed after first deploy
docker exec -it jepretin-api npm run prisma:seed

# 4. Seed full wilayah data (one-time)
docker exec -it jepretin-api node prisma/seed-wilayah.js
```

> ⚠️ Set `MIDTRANS_IS_PRODUCTION=true` for production Midtrans keys.

---

## 👥 Team

| Role               | Count |
| ------------------ | :---: |
| Backend            |   1   |
| Frontend (Flutter) |   2   |
| DevOps             |   1   |

---

## 📝 License

MIT © Jepretin
