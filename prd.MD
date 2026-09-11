# Jepretin — Product Requirement Document (PRD)

> This document is the single source of truth for Jepretin architecture, business logic, development conventions, and AI-agent guidance.
> Terakhir diperbarui: 2026-09-11

---

# 1. Project Overview

## Project Name

Jepretin

## Project Type

Marketplace jasa fotografi, videografi, dan MUA berbasis lokasi.

## Core Philosophy

"Mencari fotografer lokal dengan cepat."

## Main Objective

Jepretin dibuat untuk membantu customer menemukan provider jasa visual lokal berdasarkan wilayah coverage provider.

Platform memungkinkan:

- Customer mencari jasa visual lokal.
- Provider menawarkan jasa secara fleksibel.
- Booking dan pembayaran dilakukan online.
- Provider memiliki portfolio, bundle, dan topping sendiri.

Project dirancang menggunakan modular backend architecture dengan fokus:

- scalability
- maintainability
- AI-agent friendly architecture

---

# 2. Core Business Concept

## User Types

### Customer

User biasa yang dapat:

- mencari provider
- membuat order
- melakukan pembayaran
- memberi review
- menyukai portfolio provider

### Provider

Customer yang mengajukan diri menjadi penyedia jasa.

Provider dapat:

- memiliki multiple role
- menentukan coverage wilayah
- membuat bundle
- membuat topping
- upload portfolio
- menerima order
- menerima pembayaran melalui wallet
- mengajukan withdrawal

### Admin

Mengelola:

- approval provider
- monitoring transaksi
- monitoring order
- withdrawal approval
- moderation
- manajemen role provider
- manajemen payment category & method
- manajemen notification template
- manual wallet balance update

---

# 3. Main Features

## Authentication ✅

- Register
- Login
- Logout
- OTP verification
- Resend OTP
- Forgot password
- Reset password
- JWT authentication
- Token blacklist

## User ✅

- Get all users (admin)
- Get user by id (self)
- Update user
- Soft delete user
- Customer address CRUD (create, list, get, update, delete)

## Provider ✅

- Provider registration
- Provider approval (admin)
- Multi-role provider
- Coverage wilayah (by district)
- Availability (date range)
- Portfolio (upload via ImageKit, browse by location)
- Bundle (paket layanan dengan harga)
- Topping (add-on, standalone flag)
- Role CRUD (admin)

## Order ✅

- Create order (dengan bundle & topping)
- Order lifecycle (state machine lengkap)
- Provider matching by location (district coverage)
- Status transitions role-gated

## Payment ✅

- Midtrans Snap Redirect
- Payment status
- Payment callback/webhook (SHA-512 verified)
- Payment category CRUD (admin)
- Payment method CRUD (admin)

## Wallet ✅

- Wallet balance (provider)
- Pending balance
- Auto credit saat order COMPLETED
- Manual update (admin)

## Withdrawal ✅

- Withdrawal request (provider)
- List own requests
- Admin list all
- Admin approve / reject
- Balance management otomatis (deduct current, tambah pending saat request; selesaikan saat approve)

## Review ✅

- Create review (hanya untuk order COMPLETED, 1 review per order)
- List own reviews (customer)
- List received reviews (provider)
- Get reviews by provider
- Get single review
- Update review
- Soft delete review

## Notification ✅

- List notifications (per user)
- Unread count
- Mark as read (single & all)
- Notification template CRUD (admin)

## Like ✅

- Toggle like/unlike portfolio
- Get like count per portfolio
- List liked portfolios (my-likes)

## Wilayah ✅

- Province, regency, district, village
- Data di-seed lokal dari EMSIFA API

---

# 4. Tech Stack

## Backend

- Node.js
- Express.js 5
- Prisma ORM
- PostgreSQL

## Authentication

- JWT
- bcrypt
- otplib

## Validation

- Joi

## Mail Service

- Nodemailer (Gmail)

## Payment Gateway

- Midtrans Sandbox
- Snap Redirect

## Media Upload

- ImageKit via Multer (memory storage, max 10MB, jpg/png/mp4)

## Frontend

- Flutter

## Infrastructure

- Docker (Alpine Node 20)
- docker-compose
- express-rate-limit (100 req/15m per IP)

## Testing

- Jest + Supertest (38 tests, 32 passing, 4 suites)

## Documentation

- Swagger UI (`src/docs/swagger.json`) tersedia di `/api-docs`
- OpenAPI 3.0.3 — 19 tags, 84 paths, 74 schemas

---

# 5. Backend Architecture

Project menggunakan modular architecture.

## Main Structure

```txt
src/
 ├── docs/swagger.json
 ├── libs/
 ├── middlewares/
 ├── modules/
 ├── routes/
 ├── services/
 └── utils/
```

---

# 6. Folder Explanation

## libs/

Berisi konfigurasi third-party.

```txt
libs/
 └── nodemailer.js
```

Digunakan untuk:

- transporter email (Gmail, singleton)
- konfigurasi external service

---

## middlewares/

### authMiddleware.js

Berisi:

- authenticate()
- authorize()

Digunakan untuk:

- JWT verification
- token blacklist checking
- role authorization

### validate.js

Digunakan untuk validasi request menggunakan Joi.

### multer.js

Konfigurasi upload file:

- memoryStorage
- max 10MB
- allow: jpg, png, mp4

---

## modules/

Berisi seluruh business modules.

```txt
modules/
 ├── auth/
 ├── mailer/
 ├── user/
 ├── wilayah/
 ├── provider/
 ├── order/
 ├── payment/
 ├── wallet/
 ├── withdrawal/
 ├── review/
 ├── notification/
 └── like/
```

Setiap module memiliki struktur:

```txt
controllers/
services/
validations/
routes.js
```

### Architecture Rules

- Controller hanya menangani req/res.
- Business logic wajib di service.
- Query database dilakukan di service.
- Validation dilakukan menggunakan Joi.

---

## routes/

Berisi route aggregator (`routes/route.js`).

Digunakan untuk menggabungkan seluruh route module di bawah prefix `/api`.

---

## services/

Berisi shared services.

```txt
services/
 ├── prisma.service.js
 └── imagekit.service.js
```

Prisma singleton dan ImageKit singleton.

---

## utils/

### appError.js

Custom error class (`statusCode + message`).

### response.js

Standarisasi response API (`success()` + `error()`).

### handleAsync.js

Async error handler wrapper untuk controller.

---

## validations/

Berisi Joi validation schemas per module.

---

# 7. Coding Convention

## Controller Rules

Controller hanya:

- menerima req
- memanggil service
- mengirim response

Semua method static, dibungkus `handleAsync`.

Jangan meletakkan:

- query database
- business logic
- validation manual

di controller.

---

## Service Rules

Service bertanggung jawab untuk:

- business logic
- database query
- data processing

Class-based, static methods. Gunakan `prisma.$transaction()` untuk operasi multi-step.

---

## Validation Rules

Semua validasi menggunakan Joi.

Validation dilakukan sebelum controller dijalankan (via middleware `validate()`).

---

## Response Rules

Gunakan:

```js
success(res, code, message, data);
```

dan:

```js
error(res, code, message, data);
```

Jangan menggunakan:

```js
res.json();
```

langsung.

---

## Empty List Convention

Semua collection endpoint return **200** + `{ total, data: [] }` untuk list kosong.

**404 hanya untuk single resource not found (by ID).**

---

## Error Rules

Gunakan AppError untuk custom error handling.

---

## Database Rules

- Gunakan soft delete.
- Jangan hard delete (`prisma.xxx.delete()` dilarang).
- Semua query harus menggunakan Prisma singleton dari `prisma.service.js`.

---

# 8. API Response Convention

## Success Response

```json
{
  "code": 200,
  "message": "Success message",
  "data": {}
}
```

## Error Response

```json
{
  "code": 400,
  "message": "Error message",
  "data": {
    "detail": "Detailed explanation"
  }
}
```

---

# 9. Authentication Flow

## Register Flow

1. User register.
2. Password di-hash menggunakan bcrypt.
3. User dibuat dengan:
   - role = CUSTOMER
   - isVerified = false

4. OTP dibuat menggunakan otplib.
5. OTP di-hash sebelum disimpan.
6. OTP dikirim via email (Nodemailer/Gmail).

---

## Verify OTP Flow

1. User input OTP.
2. OTP dibandingkan menggunakan bcrypt.compare().
3. Jika valid:
   - isVerified = true
   - OTP marked as used.

---

## Login Flow

1. User login menggunakan email dan password.
2. Password dicek menggunakan bcrypt.compare().
3. JWT dibuat.
4. Token expired dalam 5 jam.

Payload JWT:

```json
{
  "id": "userId",
  "email": "email",
  "role": "CUSTOMER"
}
```

---

## Logout Flow

1. JWT diambil dari Authorization header.
2. Token dimasukkan ke TokenBlacklist.
3. Middleware akan mengecek blacklist setiap request.

---

# 10. Role System

## Global User Role

Disimpan di:

```prisma
User.role
```

Role:

- CUSTOMER
- PROVIDER
- ADMIN

Default:

- CUSTOMER

---

## Provider Role

Provider dapat memiliki multiple role.

Relasi:

```txt
Provider
 ↳ ProviderRole
    ↳ Role
```

Contoh:

- Photographer
- Videographer
- MUA

Satu provider dapat memiliki lebih dari satu role.

Role dikelola oleh admin melalui endpoint CRUD.

---

# 11. Provider System

## Provider Registration Flow

1. User register sebagai customer.
2. User mengajukan menjadi provider.
3. Admin melakukan approval.
4. Jika diterima:
   - User.role menjadi PROVIDER
   - Provider.status menjadi ACCEPTED

---

## Provider Status

```txt
PENDING
ACCEPTED
REJECTED
```

Digunakan untuk verifikasi provider oleh admin.

---

## Provider Coverage

Provider dapat memiliki banyak coverage district.

Relasi:

```txt
Provider
 ↳ ProviderCoverage
    ↳ District
```

Customer hanya dapat memesan provider yang memiliki district coverage sesuai district customer.

---

## Provider Availability

Digunakan untuk menentukan tanggal provider tidak tersedia.

Field:

- startDate
- endDate
- isAvailable (boolean)

Saat ini masih manual input dari provider.

Future:

- realtime scheduler
- auto conflict checking
- calendar sync

---

## Provider Portfolio

Provider dapat upload:

- image
- video (mp4)

Upload media menggunakan ImageKit via Multer (memory storage, max 10MB).

Upload dilakukan melalui backend. Mendukung bulk upload (up to 10 files sekaligus).

Browse portfolio by location (district matching) tersedia.

---

## Provider Bundle

Provider dapat membuat paket layanan.

Contoh:

- Wedding Package
- Graduation Package
- Prewedding Package

Provider menentukan harga sendiri (Decimal 12,2).

---

## Provider Topping

Add-on tambahan.

Contoh:

- Drone
- Album
- Extra hour

Topping dapat:

- standalone (dapat dipesan tanpa bundle)
- tambahan bundle

---

# 12. Location System

## Purpose

Digunakan untuk matching provider dan customer berdasarkan wilayah.

---

## Structure

```txt
Province
 └── Regency
      └── District
           └── Village
```

---

## Source API

Menggunakan:
EMSIFA API Wilayah Indonesia.

Data di-seed ke database lokal.

Tujuan:

- mengurangi dependency external API
- meningkatkan performa
- cache wilayah lokal

---

## Matching Logic

Order memiliki:

```txt
addressId → CustomerAddress → villageId → Village → districtId
```

Provider coverage memiliki:

```txt
districtId
```

Provider hanya muncul jika district coverage sesuai district customer.

---

# 13. Order System

## Order Rules

- Satu order hanya untuk satu provider.
- Customer dapat memilih:
  - bundle
  - topping
  - topping standalone

---

## Order Lifecycle

```txt
PENDING
PAID
IN_PROGRESS
WAITING_CONFIRMATION
COMPLETED
CANCELLED
EXPIRED
REFUNDED
```

---

## Order Status Transition Logic

```txt
PENDING ──(customer cancel)──→ CANCELLED
PENDING ──(webhook payment)──→ PAID
PAID ──(provider accept)──→ IN_PROGRESS
IN_PROGRESS ──(provider finish)──→ WAITING_CONFIRMATION
WAITING_CONFIRMATION ──(customer confirm)──→ COMPLETED
ADMIN: override any status (no restrictions)
```

---

# 14. Payment System

## Gateway

Midtrans Sandbox.

## Payment Method

Snap Redirect.

---

## Payment Flow

1. Customer checkout.
2. Backend membuat transaksi Midtrans.
3. Customer diarahkan ke Snap Redirect.
4. Midtrans callback (webhook) mengubah payment status (SHA-512 signature verified).
5. Order status berubah sesuai status pembayaran.

---

## Payment Category & Method

Admin dapat mengelola:

- Payment category (contoh: Transfer Bank, E-Wallet)
- Payment method per category (contoh: BCA, OVO)

Keduanya mendukung soft delete.

---

## Wallet Integration

Wallet provider tidak langsung bertambah saat payment success.

Wallet hanya bertambah setelah:

```txt
Order COMPLETED
```

Logic ada di `order.service.js` → `updateOrderStatus()`.

Tujuan:

- menghindari fraud
- menghindari refund abuse

---

# 15. Wallet System

## Wallet

Provider memiliki wallet.

Field:

- currentBalance
- pendingBalance
- currency (default: IDR)
- lastPayoutAt

---

## Wallet Transaction

Digunakan untuk mencatat:

- CREDIT (order selesai, withdrawal rejected → balance dikembalikan)
- DEBIT (withdrawal request)

Status transaksi:

- PENDING
- SUCCESS
- FAILED

---

## Withdrawal Request

Provider dapat mengajukan pencairan dana.

Informasi yang diperlukan:

- bankName
- bankAccountNumber
- bankAccountName

Flow:

1. Provider request withdrawal → currentBalance dikurangi, pendingBalance ditambah.
2. Admin approve → status APPROVED/PAID.
3. Admin reject → balance dikembalikan ke currentBalance, pendingBalance dikurangi.

Saat ini proses payout masih manual.

Future:

- automatic payout
- gateway integration

---

# 16. Review System

## Rules

- Review hanya dapat dibuat untuk order dengan status COMPLETED.
- Satu order hanya boleh memiliki satu review.
- Rating menggunakan integer.
- Comment bersifat opsional.

## Endpoints

- Create review
- List own reviews (customer)
- List received reviews (provider)
- Get reviews by providerId
- Get single review
- Update review
- Soft delete review

---

# 17. Like System

## Purpose

Customer dapat menyukai portfolio provider sebagai bentuk engagement.

## Rules

- Toggle like/unlike pada portfolio item.
- Satu user hanya dapat like satu portfolio satu kali (unique constraint).

## Endpoints

- Toggle like/unlike
- Get like count per portfolio
- Get my-likes (daftar portfolio yang disukai)

---

# 18. Notification System

## Notification Types

```txt
ORDER_STATUS
PAYMENT
SYSTEM
PROMO
GREETING
```

---

## Current Notifications

- In-app notification (list, unread count, mark read)
- Email notification (OTP, password reset via Nodemailer)
- Notification template CRUD (admin)

Future:

- Push notification
- Realtime notification (WebSocket/SSE)

---

# 19. Security Rules

## Password

- bcrypt hashing

## OTP

- di-hash sebelum disimpan
- memiliki expiration
- request count tracking

## JWT

- JWT authentication
- token blacklist
- authorization middleware

## Rate Limiting

- 100 request per 15 menit per IP
- via express-rate-limit

## Soft Delete

Semua entity menggunakan:

```prisma
deletedAt DateTime?
```

Data tidak benar-benar dihapus.

---

# 20. Database Schema — 26 Models, 9 Enums

## Models

### Core Identity
- User, Provider, Role, ProviderRole

### Geography
- Province, Regency, District, Village, CustomerAddress, ProviderCoverage

### Provider Catalog
- ProviderAvailability, ProviderPortfolio, ProviderBundle, ProviderTopping

### Order
- Order, OrderItem, OrderItemTopping

### Payment
- PaymentCategory, PaymentMethod, Payment

### Financial
- Wallet, WalletTransaction, WithdrawalRequest

### Auth/Security
- OtpToken, PasswordReset, TokenBlacklist

### Social
- NotificationTemplate, Notification, Review, Like

## Enums

- UserRole: CUSTOMER, PROVIDER, ADMIN
- ProviderStatus: PENDING, ACCEPTED, REJECTED
- OrderStatus: PENDING, PAID, IN_PROGRESS, WAITING_CONFIRMATION, COMPLETED, CANCELLED, EXPIRED, REFUNDED
- PaymentStatus: PENDING, SUCCESS, FAILED, REFUNDED
- PaymentType: CUSTOMER_PAYMENT, WITHDRAWAL_PAYOUT, REFUND
- NotificationType: ORDER_STATUS, PAYMENT, SYSTEM, PROMO, GREETING
- WalletTransactionType: CREDIT, DEBIT
- WalletTransactionStatus: PENDING, SUCCESS, FAILED
- WithdrawalStatus: PENDING, PROCESSING, APPROVED, PAID, REJECTED

---

# 21. Important Business Rules

## User & Provider

- Semua provider berasal dari customer.
- User dapat menjadi customer dan provider sekaligus.

---

## Order

- Satu order hanya untuk satu provider.
- Provider menentukan harga sendiri.
- Order address menggunakan CustomerAddress yang harus dimiliki customer.

---

## Payment

- Wallet masuk setelah order COMPLETED.
- Midtrans menggunakan Snap Redirect.
- Webhook diverifikasi menggunakan SHA-512 signature.

---

## Provider

- Provider bisa multi-role.
- Provider bisa memiliki banyak district coverage.
- Provider baru butuh approval admin sebelum aktif.

---

## Review

- Hanya untuk order COMPLETED.
- Satu order = satu review.

---

# 22. Environment Variables

## Required ENV

```env
DATABASE_URL=
JWT_SECRET=

EMAIL_USER=
EMAIL_PASS=

MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

PORT=3000
```

---

# 23. Infrastructure

## Docker

- Dockerfile (Alpine Node 20)
- docker-compose.yml

## Testing

- Jest + Supertest
- 38 tests total, 32 passing (4 suites)
- Mocked: Nodemailer, Midtrans client
- Global setup: seed wilayah + roles ke test DB

## Seeder

- Demo data: 5 users, 2 providers, 3 orders
- Roles: Photographer, Videographer, MUA
- Payment categories & methods

## Swagger

- OpenAPI 3.0.3
- 84 paths, 74 schemas, 19 tags
- Tersedia di `/api-docs`

## SQL Views

- 10 readable views untuk query analytics

---

# 24. Total API Endpoints (~100 aktif)

| Module | Jumlah Endpoint |
|--------|----------------|
| Auth | 7 |
| User + Address | 9 |
| Wilayah | 4 |
| Provider | 39 |
| Order | 6 |
| Payment | 12 |
| Wallet | 2 |
| Withdrawal | 6 |
| Review | 7 |
| Notification | 9 |
| Like | 3 |
| **Total** | **~104** |

---

# 25. MVP Status (per 2026-09-11)

## Completed ✅

- Authentication system (register, login, logout, OTP, forgot/reset password)
- JWT auth + token blacklist
- User CRUD + CustomerAddress CRUD
- Wilayah API (province → village, seeded lokal)
- Database schema (26 models, 9 enums, soft delete semua)
- Modular architecture
- Provider module lengkap (registration, approval, role, coverage, portfolio, bundle, topping, availability)
- Order module (create, lifecycle, status transitions)
- Payment module (Midtrans Snap, webhook, category, method)
- Wallet module (auto credit on COMPLETED)
- Withdrawal module (request, approve, reject)
- Review module (CRUD, tied to COMPLETED order)
- Notification module (in-app, template CRUD)
- Like module (toggle, count, my-likes)
- Rate limiting
- Swagger documentation
- Docker containerization
- Jest + Supertest testing (32/38 passing)
- Demo seeder
- SQL views

## In Progress / Known Limitations

- 6 failing tests (variable scoping bug di integration.test.js)
- Review module belum ada test coverage
- Provider availability belum ada conflict detection otomatis
- Withdrawal payout masih manual (belum ada gateway payout)
- Notifikasi belum realtime (belum ada WebSocket/SSE)

## Not Yet Started (Future Roadmap)

- Push notification
- Realtime notification (WebSocket/SSE)
- Refund automation
- Promo / voucher system
- Recommendation engine
- Advanced search & filter
- Customer favorites
- Provider calendar integration
- Auto booking conflict detection
- Admin dashboard UI
- Analytics (revenue, order, provider stats)

---

# 26. Future Roadmap

## Provider

- realtime availability
- auto booking conflict detection
- calendar integration

## Customer

- advanced search
- recommendation system
- favorites

## Payment

- refund system
- promo system
- voucher system

## Notification

- push notification
- realtime notification (WebSocket/SSE)

## Admin

- admin dashboard UI
- provider verification panel dengan lebih banyak kontrol

## Analytics

- provider statistics
- order statistics
- revenue tracking

---

# 27. Known MVP Limitations

## Current Limitations

- Provider availability masih manual (belum ada conflict detection).
- Withdrawal payout masih manual (belum ada gateway integration).
- Belum ada realtime notification.
- Belum ada refund automation.
- Belum ada promo system.
- Belum ada recommendation engine.
- 6 test cases masih failing (bug di integration.test.js).
- Review module belum memiliki test coverage.

---

# 28. AI Agent Instructions

## IMPORTANT

AI wajib mengikuti architecture dan business rules project ini.

---

## Architecture Rules

- Jangan mengubah modular architecture.
- Jangan memindahkan business logic ke controller.
- Gunakan service untuk seluruh business logic.

---

## Response Rules

Wajib menggunakan:

```txt
utils/response.js
```

---

## Error Rules

Gunakan:

```txt
AppError
```

untuk custom error.

---

## Validation Rules

Gunakan Joi validation.

---

## Database Rules

- Gunakan Prisma ORM.
- Gunakan soft delete (`deletedAt`).
- Jangan hard delete (`prisma.xxx.delete()` dilarang).

---

## Authentication Rules

- Gunakan JWT middleware.
- Gunakan authorize() untuk protected routes.
- Selalu cek token blacklist.

---

## Empty List Convention

- Return 200 + `{ total: 0, data: [] }` untuk empty collection.
- 404 hanya untuk single resource not found by ID.

---

## Coding Style

- Gunakan async/await.
- Gunakan static method.
- Gunakan modular structure.
- Gunakan naming convention konsisten.
- Semua controller dibungkus `handleAsync`.

---

# 29. Final Notes

Jepretin adalah marketplace jasa visual berbasis lokasi dengan fokus utama:

"Membantu customer menemukan fotografer lokal dengan cepat."

Project dirancang sejak awal menggunakan scalable architecture agar dapat berkembang menjadi platform marketplace profesional di masa depan.
