# Jepretin — Product Requirement Document (PRD)

> This document is the single source of truth for Jepretin architecture, business logic, development conventions, and AI-agent guidance.

---

# 1. Project Overview

## Project Name

Jepretin

## Project Type

Marketplace jasa fotografi, videografi, dan MUA berbasis lokasi.

## Core Philosophy

“Mencari fotografer lokal dengan cepat.”

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

### Admin

Mengelola:

- approval provider
- monitoring transaksi
- monitoring order
- withdrawal approval
- moderation

---

# 3. Main Features

## Authentication

- Register
- Login
- Logout
- OTP verification
- Resend OTP
- Forgot password
- Reset password
- JWT authentication
- Token blacklist

## User

- Get all users
- Get user by id
- Update user
- Soft delete user

## Provider

- Provider registration
- Provider approval
- Multi-role provider
- Coverage wilayah
- Availability
- Portfolio
- Bundle
- Topping

## Order

- Create order
- Bundle/topping selection
- Provider matching by location
- Order lifecycle

## Payment

- Midtrans Snap Redirect
- Payment status
- Payment callback/webhook

## Wallet

- Wallet balance
- Pending balance
- Withdrawal request
- Wallet transaction

## Notification

- Email notification
- In-app notification
- Future push notification

---

# 4. Tech Stack

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

## Authentication

- JWT
- bcrypt
- otplib

## Validation

- Joi

## Mail Service

- Nodemailer

## Payment Gateway

- Midtrans Sandbox
- Snap Redirect

## Media Upload

- ImageKit

## Frontend

- Flutter

---

# 5. Backend Architecture

Project menggunakan modular architecture.

## Main Structure

```txt
src/
 ├── libs/
 ├── middlewares/
 ├── modules/
 ├── routes/
 ├── services/
 ├── utils/
 └── validations/
```

---

# 6. Folder Explanation

## libs/

Berisi konfigurasi third-party.

Contoh:

```txt
libs/
 └── nodemailer.js
```

Digunakan untuk:

- transporter email
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

---

## modules/

Berisi seluruh business modules.

Contoh:

```txt
modules/
 ├── auth/
 ├── mailer/
 ├── user/
 ├── wilayah/
 ├── provider/
 ├── order/
 ├── payment/
 └── wallet/
```

Setiap module memiliki struktur:

```txt
controllers/
services/
routes.js
```

### Architecture Rules

- Controller hanya menangani req/res.
- Business logic wajib di service.
- Query database dilakukan di service.
- Validation dilakukan menggunakan Joi.

---

## routes/

Berisi route aggregator.

Digunakan untuk menggabungkan seluruh route module.

---

## services/

Berisi shared services.

Contoh:

```txt
services/
 └── prisma.service.js
```

Digunakan agar Prisma singleton dan tidak membuat koneksi berulang.

---

## utils/

### appError.js

Custom error class.

### response.js

Standarisasi response API.

---

## validations/

Berisi Joi validation schemas.

Contoh:

```txt
validations/
 └── auth.validation.js
```

---

# 7. Coding Convention

## Controller Rules

Controller hanya:

- menerima req
- memanggil service
- mengirim response

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

---

## Validation Rules

Semua validasi menggunakan Joi.

Validation dilakukan sebelum controller dijalankan.

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

## Error Rules

Gunakan AppError untuk custom error handling.

---

## Database Rules

- Gunakan soft delete.
- Jangan hard delete.
- Semua query harus menggunakan Prisma.

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
6. OTP dikirim via email.

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
  "user": "userId",
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
- isAvailable

Saat ini masih manual.

Future:

- realtime scheduler
- auto conflict checking
- calendar sync

---

## Provider Portfolio

Provider dapat upload:

- image
- video

Upload media menggunakan ImageKit.

Upload dilakukan melalui backend.

---

## Provider Bundle

Provider dapat membuat paket layanan.

Contoh:

- Wedding Package
- Graduation Package
- Prewedding Package

Provider menentukan harga sendiri.

---

## Provider Topping

Add-on tambahan.

Contoh:

- Drone
- Album
- Extra hour

Topping dapat:

- standalone
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
districtId
```

Provider coverage juga memiliki:

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
COMPLETED
CANCELLED
EXPIRED
REFUNDED
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
4. Midtrans callback mengubah payment status.
5. Order status berubah.

---

## Wallet Integration

Wallet provider tidak langsung bertambah saat payment success.

Wallet hanya bertambah setelah:

```txt
Order COMPLETED
```

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
- currency
- lastPayoutAt

---

## Wallet Transaction

Digunakan untuk mencatat:

- credit
- debit
- refund
- withdrawal

---

## Withdrawal Request

Provider dapat mengajukan pencairan dana.

Saat ini masih manual.

Future:

- automatic payout
- gateway integration

---

# 16. Notification System

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

- Email notification
- In-app notification

Future:

- Push notification

---

# 17. Security Rules

## Password

- bcrypt hashing

## OTP

- di-hash sebelum disimpan
- memiliki expiration

## JWT

- JWT authentication
- token blacklist
- authorization middleware

## Soft Delete

Semua entity menggunakan:

```prisma
deletedAt DateTime?
```

Data tidak benar-benar dihapus.

---

# 18. Important Business Rules

## User & Provider

- Semua provider berasal dari customer.
- User dapat menjadi customer dan provider sekaligus.

---

## Order

- Satu order hanya untuk satu provider.
- Provider menentukan harga sendiri.

---

## Payment

- Wallet masuk setelah order COMPLETED.
- Midtrans menggunakan Snap Redirect.

---

## Provider

- Provider bisa multi-role.
- Provider bisa memiliki banyak district coverage.

---

# 19. Environment Variables

## Required ENV

```env
DATABASE_URL=
JWT_SECRET=

EMAIL_USER=
EMAIL_PASS=

MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

---

# 20. Current MVP Scope

## Completed

- Authentication system
- OTP system
- JWT auth
- User CRUD
- Wilayah API
- Database schema
- Soft delete architecture
- Modular architecture

## In Progress

- Provider module
- Order module
- Payment module
- Wallet module

---

# 21. Future Roadmap

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
- realtime notification

## Admin

- admin dashboard
- provider verification panel
- withdrawal approval

## Analytics

- provider statistics
- order statistics
- revenue tracking

---

# 22. Known MVP Limitations

## Current Limitations

- Provider availability masih manual.
- Withdrawal masih manual.
- Belum ada realtime notification.
- Belum ada refund automation.
- Belum ada promo system.
- Belum ada recommendation engine.

---

# 23. AI Agent Instructions

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
- Gunakan soft delete.
- Jangan hard delete.

---

## Authentication Rules

- Gunakan JWT middleware.
- Gunakan authorize() untuk protected routes.
- Selalu cek token blacklist.

---

## Coding Style

- Gunakan async/await.
- Gunakan static method.
- Gunakan modular structure.
- Gunakan naming convention konsisten.

---

# 24. Final Notes

Jepretin adalah marketplace jasa visual berbasis lokasi dengan fokus utama:

“Membantu customer menemukan fotografer lokal dengan cepat.”

Project dirancang sejak awal menggunakan scalable architecture agar dapat berkembang menjadi platform marketplace profesional di masa depan. "
