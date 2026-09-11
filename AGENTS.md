# AGENTS.md — Jepretin Backend

> AI agent context file. Baca ini dulu sebelum bekerja di project ini.
> Terakhir diperbarui: 2026-09-11 (Final — Production Ready)

---

## 1. Identitas Project

| Field | Detail |
|-------|--------|
| Nama | Jepretin Backend |
| Tipe | Marketplace jasa fotografi, videografi, dan MUA berbasis lokasi |
| Stack | Node.js + Express 5 + Prisma ORM + PostgreSQL |
| Auth | JWT + bcrypt + otplib (OTP via email) |
| Validation | Joi (Strict validation + string limits) |
| Payment Gateway | Midtrans Sandbox/Production (Snap Redirect) |
| Media Upload | ImageKit via Multer (memory storage, max 10MB, jpg/png/mp4) |
| Email | Nodemailer + Gmail |
| Docs | Swagger UI (`src/docs/swagger.json`), tersedia di `/api-docs` |
| Entry | `app.js`, port default 3000 |
| Rate Limiting | 100 req/15 menit per IP via express-rate-limit |
| Security | Helmet.js + CORS Whitelist (`ALLOWED_ORIGINS` di `.env`) |
| Container | Dockerfile (Alpine Node 20) |
| Testing | JEST + Supertest (48 tests, 48 passing) |
| Total Endpoints | **~104 aktif** |
| Total Source Files | **92** di `src/` |

---

## 2. Struktur Direktori

```
src/
├── docs/swagger.json              # OpenAPI 3.0.3 — 19 tags, 84 paths, 74 schemas
├── jobs/                          # Cron jobs
│   └── cleanup.job.js             # TokenBlacklist cleanup job (berjalan tiap jam)
├── libs/nodemailer.js             # Singleton Nodemailer transporter (Gmail)
├── middlewares/
│   ├── authMiddleware.js          # authenticate() + authorize(...roles)
│   ├── multer.js                  # Upload config (memoryStorage, 10MB limit)
│   └── validate.js                # Joi validation wrapper → AppError
├── modules/
│   ├── auth/                      # Register, login, logout, OTP, forgot/reset password
│   ├── mailer/                    # Email service (OTP, reset password)
│   ├── user/                      # User CRUD + address CRUD + avatar upload
│   ├── wilayah/                   # Province, regency, district, village
│   ├── provider/                  # Core + role + coverage + portfolio + bundle + topping + availability + search
│   ├── order/                     # Order CRUD + status transitions + paginations
│   ├── payment/                   # Midtrans Snap + webhook + category + method
│   ├── wallet/                    # Provider wallet balance
│   ├── withdrawal/                # Withdrawal request + approve/reject
│   ├── review/                    # Customer review + rating
│   ├── notification/              # Notification list + read + template CRUD
│   └── like/                      # Like toggle + count + my-likes
├── routes/route.js                # Route aggregator — mounts all modules under /api
├── services/
│   ├── prisma.service.js          # Prisma Client singleton
│   └── imagekit.service.js        # ImageKit singleton
└── utils/
    ├── appError.js                # Custom error class (statusCode + message)
    ├── handleAsync.js             # Async error handler wrapper
    ├── pagination.js              # parsePagination() untuk list endpoints
    └── response.js                # success(res, code, msg, data) + error(res, code, msg, data)
```

---

## 3. Konvensi Wajib (JANGAN DILANGGAR)

### Controller
- **Hanya** menangani `req`/`res`, memanggil service, mengirim response
- JANGAN taruh query DB atau business logic di controller
- Semua method static, dibungkus `handleAsync`
- Wajib pakai `success()` / `error()` — jangan `res.json()` langsung

### Service
- Semua business logic + query database ada di sini
- Class-based, static methods
- Gunakan `prisma.$transaction()` untuk operasi multi-step
- Throw `AppError(message, statusCode)` untuk error
- Semua endpoint `GET` yang return list **WAJIB** pakai pagination (`parsePagination`)

### Validation
- Semua validasi pakai **Joi**
- Schema di file `validations/*.validation.js`
- Diterapkan via middleware `validate()`
- Semua input string WAJIB memiliki batasan `.max()` (contoh: max 100 untuk nama, 500 untuk URL/desc).

### Database
- **Soft delete only** — semua model pakai `deletedAt DateTime?`
- JANGAN hard delete (`prisma.xxx.delete()`)
- Semua query lewat Prisma singleton dari `src/services/prisma.service.js`

### Auth & Security
- JWT payload: `{ id, email, role }` — expire 5 jam
- `authenticate` → verifikasi token + cek blacklist
- `authorize(...roles)` → cek role di `req.user.role`
- Logout → masukkan token ke `TokenBlacklist`
- ENV wajib akan di-check pada `app.js` sebelum startup

### API Response Format
```json
// Success (Single/Action):
{ "code": 200, "message": "...", "data": {} }

// Success (List with Pagination):
{ "code": 200, "message": "...", "data": { "total": 10, "page": 1, "limit": 20, "data": [] } }

// Error:
{ "code": 400, "message": "...", "data": { "detail": "..." } }
```

### Empty List Convention
- Semua collection endpoint return **200** + pagination object kosong untuk list kosong
- **404 hanya untuk single resource not found** (by ID)

---

## 4. Seluruh API Endpoint (~104 aktif)

Base: `/api`

### Auth (7 ep)
| Method | Path | Auth |
|--------|------|------|
| POST | /auth/register | None |
| POST | /auth/login | None |
| POST | /auth/logout | JWT |
| POST | /auth/otp/verify | None |
| POST | /auth/otp/resend | None |
| POST | /auth/forgot-password | None |
| POST | /auth/reset-password | None |

### User (5 ep) + User Address (5 ep)
| Method | Path | Auth |
|--------|------|------|
| GET | /user/all-user | JWT + ADMIN |
| GET | /user/get-user | JWT |
| PUT | /user/update-user | JWT |
| PUT | /user/update-avatar | JWT (multipart) |
| DELETE | /user/delete-user | JWT |
| POST | /user/address | JWT |
| GET | /user/address | JWT |
| GET | /user/address/:id | JWT |
| PUT | /user/address/:addressId | JWT |
| DELETE | /user/address/:id | JWT |

### Wilayah (4 ep)
| Method | Path | Auth |
|--------|------|------|
| GET | /wilayah/provinces | JWT |
| GET | /wilayah/regencies/:provinceId | JWT |
| GET | /wilayah/districts/:regencyId | JWT |
| GET | /wilayah/villages/:districtId | JWT |

### Provider (40 ep)
| Method | Path | Auth |
|--------|------|------|
| GET | /provider/search | JWT (Public Search) |
| GET | /provider/all-provider | JWT + ADMIN |
| GET | /provider/get-provider | JWT |
| POST | /provider/provider | JWT |
| PUT | /provider/update-provider | JWT |
| PUT | /provider/update-status/:id | JWT + ADMIN |
| DELETE | /provider/delete-provider | JWT |
| POST | /provider/assign-role | JWT |
| GET | /provider/roles | JWT |
| DELETE | /provider/remove-role | JWT |
| POST | /provider/role | JWT + ADMIN |
| PUT | /provider/role/:id | JWT + ADMIN |
| POST | /provider/coverage | JWT |
| DELETE | /provider/coverage/:districtId | JWT |
| GET | /provider/coverage | JWT |
| GET | /provider/coverage/:districtId | JWT |
| POST | /provider/portofolio | JWT (multipart) |
| GET | /provider/all-portofolio | JWT + ADMIN |
| GET | /provider/my-portofolio | JWT |
| GET | /provider/get-portofolio/:providerId | JWT |
| GET | /provider/portofolio-by-location | JWT |
| PUT | /provider/portofolio/:id | JWT (multipart) |
| DELETE | /provider/portofolio/:id | JWT |
| POST | /provider/bundle | JWT |
| GET | /provider/all-bundle | JWT |
| GET | /provider/my-bundle | JWT |
| GET | /provider/bundle/:providerId | JWT |
| PUT | /provider/bundle/:id | JWT |
| DELETE | /provider/bundle/:id | JWT |
| POST | /provider/topping | JWT |
| GET | /provider/all-topping | JWT |
| GET | /provider/my-topping | JWT |
| GET | /provider/topping/:providerId | JWT |
| PUT | /provider/topping/:id | JWT |
| DELETE | /provider/topping/:id | JWT |
| POST | /provider/availability | JWT |
| GET | /provider/availability | JWT |
| GET | /provider/availability/:id | JWT |
| PUT | /provider/availability/:id | JWT |
| DELETE | /provider/availability/:id | JWT |

### Order (6 ep)
| Method | Path | Auth |
|--------|------|------|
| POST | /order/order | JWT |
| GET | /order/all-order | JWT + ADMIN |
| GET | /order/my-orders | JWT |
| GET | /order/provider-orders | JWT |
| GET | /order/order/:orderId | JWT |
| PUT | /order/order/:orderId | JWT |

### Payment (10 ep)
| Method | Path | Auth |
|--------|------|------|
| POST | /payment/payment | JWT |
| POST | /payment/webhook | None |
| GET | /payment/my-payment | JWT |
| GET | /payment/payment/:id | JWT |
| POST | /payment/category | JWT + ADMIN |
| GET | /payment/category | JWT |
| PUT | /payment/category/:id | JWT + ADMIN |
| DELETE | /payment/category/:id | JWT + ADMIN |
| POST | /payment/method | JWT + ADMIN |
| GET | /payment/method | JWT |
| PUT | /payment/method/:id | JWT + ADMIN |
| DELETE | /payment/method/:id | JWT + ADMIN |

### Wallet (2 ep)
| Method | Path | Auth |
|--------|------|------|
| GET | /wallet/wallet | JWT |
| POST | /wallet/update-balance | JWT + ADMIN |

### Withdrawal (6 ep)
| Method | Path | Auth |
|--------|------|------|
| POST | /withdrawal/request | JWT |
| GET | /withdrawal/my-requests | JWT |
| GET | /withdrawal/all-requests | JWT + ADMIN |
| GET | /withdrawal/:id | JWT |
| PUT | /withdrawal/:id/approve | JWT + ADMIN |
| PUT | /withdrawal/:id/reject | JWT + ADMIN |

### Review (7 ep)
| Method | Path | Auth |
|--------|------|------|
| POST | /review/review | JWT |
| GET | /review/my-reviews | JWT |
| GET | /review/provider-reviews | JWT |
| GET | /review/provider/:providerId | JWT |
| GET | /review/:id | JWT |
| PUT | /review/:id | JWT |
| DELETE | /review/:id | JWT |

### Notification (9 ep)
| Method | Path | Auth |
|--------|------|------|
| GET | /notification | JWT |
| GET | /notification/unread-count | JWT |
| PUT | /notification/:id/read | JWT |
| PUT | /notification/read-all | JWT |
| POST | /notification/template | JWT + ADMIN |
| GET | /notification/template | JWT |
| GET | /notification/template/:id | JWT |
| PUT | /notification/template/:id | JWT + ADMIN |
| DELETE | /notification/template/:id | JWT + ADMIN |

### Like (3 ep)
| Method | Path | Auth |
|--------|------|------|
| POST | /like/toggle | JWT |
| GET | /like/count/:portfolioId | JWT |
| GET | /like/my-likes | JWT |

---

## 5. Order Status Transition Logic

```txt
PENDING ──(customer cancel)──→ CANCELLED
PENDING ──(webhook payment)──→ PAID
PAID ──(provider accept)──→ IN_PROGRESS
IN_PROGRESS ──(provider finish)──→ WAITING_CONFIRMATION
WAITING_CONFIRMATION ──(customer confirm)──→ COMPLETED
ADMIN: override any status (no restrictions)
```

---

## 6. Notification Automations

1. **New Order**: Saat order dibuat, Provider otomatis dikirim notifikasi.
2. **Order PAID**: Saat Webhook Midtrans merespon `SUCCESS`, status Order update jadi `PAID` dan Customer dikirim notifikasi.
3. **Order FAILED**: Saat Webhook `FAILED`, Customer dikirim notifikasi.
4. **Order COMPLETED/CANCELLED**: Saat status order berubah, Provider dikirim notifikasi tambahan sesuai status terbaru.
5. **Withdrawal**: Approval / Rejection oleh Admin otomatis mengirim notifikasi ke Provider.

---

## 7. Project Status: Production Ready 🚀

Backend sudah mencapai status MVP dan sudah diperkuat untuk standar production:
- 48 test cases berjalan sukses (100% test pass).
- CORS Whitelist terpusat.
- Midtrans Production Flag terverifikasi (env error prevention).
- Cron Job otomatis untuk cleanup `TokenBlacklist` (setiap jam).
- Pagination di semua endpoint yang me-return `list/array`.
- Validasi Input Strict via Joi (`.max` lengths ditambahkan agar tidak ada vulnerability payload bombing).

---

## 8. Command Penting

```bash
npm start                # Start dev server (nodemon app.js)
npm test                 # Run JEST tests
npm run prisma:seed      # Seed database (roles + payment + demo data)
npx prisma migrate dev   # Run pending migrations
npx prisma generate      # Regenerate Prisma client
node prisma/seed-wilayah # One-time: fetch Indonesia wilayah data
docker build -t jepretin-backend .   # Build Docker image
```

## 9. Environment Variables (`.env`)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
EMAIL_USER=...@gmail.com
EMAIL_PASS=...
MIDTRANS_SERVER_KEY=...
MIDTRANS_CLIENT_KEY=...
MIDTRANS_IS_PRODUCTION=true    # WARNING: if false, will print warning
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...
ALLOWED_ORIGINS=https://jepretin.com,http://localhost:3000
PORT=3000
```

## 10. Test Demo Accounts (password: password123)

```
admin@jepretin.com    — Admin
rina@jepretin.com     — Customer
budi@jepretin.com     — Customer
andi@jepretin.com     — Provider (Photographer + Videographer)
sari@jepretin.com     — Provider (MUA)
```
