# Jepretin Backend — Comprehensive Technical Audit

**Audit Date:** 2026-10-11  
**Auditor:** Senior Software Engineer / Backend Architect / QA Engineer  
**Workspace Path:** `jepretin-backend/`  
**Repository State:** Partially completed MVP, 48 passing automated tests, ~104 active endpoints.

---

## 1. Audit Metadata and Scope

- **Repository:** `jepretin-backend`
- **Audit Type:** Read-Only Architectural, Codebase, Database & Integration Audit
- **Files Inspected:**
  - Root configuration: `package.json`, `app.js`, `AGENTS.md`, `README.md`, `prd.MD`, `jest.config.js`, `Dockerfile`, `docker-compose.yml`, `.env.test`, `.gitignore`, `.dockerignore`
  - Database: `prisma/schema.prisma`, 18 migration directories in `prisma/migrations/`, `prisma/data/seed.js`
  - Application source: 92 files across 12 modules in `src/` (controllers, services, validations, routes, helpers, middlewares, utils, libs, jobs)
  - Tests: `tests/setup.js`, `tests/helpers.js`, `tests/auth.test.js`, `tests/crud.test.js`, `tests/webhook.test.js`, `tests/review.test.js`, `tests/integration.test.js`
  - Scripts: `scripts/update-swagger.js`, `scripts/download-wilayah.js`
- **Execution Evidence:** Test suite executed on `2026-10-11` via `npm test` (`jest --config jest.config.js --no-cache --detectOpenHandles --forceExit`). 5 test suites passed, 48 tests passed in 30.014s.

---

## 2. Executive Summary

The Jepretin backend is a Node.js/Express.js service built on Prisma ORM and PostgreSQL. The system implements a multi-role marketplace connecting Customers with creative service Providers (Photographers, Videographers, Makeup Artists) under Admin supervision.

Key highlights:
- **Core workflows implemented:** User registration with TOTP verification, provider onboarding and admin approval, catalog management (bundles and add-on toppings), location coverage (Indonesian administrative hierarchy down to villages), order placement with booking schedule conflicts checking, Midtrans Snap payment integration, automated webhook processing, provider wallet ledger, provider withdrawal workflows, and customer reviews.
- **Architectural maturity:** Structured layered architecture (Route → Middleware → Controller → Service → Prisma) with standard response formatting (`success()` / `error()`) and strict Joi validations.
- **Critical findings requiring attention:**
  - `PaymentService.handleWebhook` runs without a database transaction and lacks an idempotency check, introducing risk of race conditions on duplicate webhook callbacks.
  - `PasswordService.resetPassword` does not wrap `jwt.verify` in a try-catch, triggering 500 Internal Server Errors instead of 400 Bad Request on invalid tokens.
  - Password and email updates in `UserService.updateUser` lack re-verification and current password challenges.
  - Several list endpoints lack pagination, violating the project convention stated in `AGENTS.md`.

---

## 3. Verified Technology Stack

| Component | Technology | Version | Verification Source |
|---|---|---|---|
| **Runtime** | Node.js | v20 LTS (Alpine Docker target) | `Dockerfile:1`, `AGENTS.md:24` |
| **Framework** | Express.js | `^5.1.0` | `package.json:28` |
| **ORM** | Prisma Client / CLI | `^5.22.0` | `package.json:22,41` |
| **Database** | PostgreSQL | 16 (via Docker compose) | `docker-compose.yml:4` |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) | `^9.0.2` | `package.json:34` |
| **Password Hashing** | `bcrypt` | `^6.0.0` | `package.json:24` |
| **OTP Engine** | `otplib` (TOTP) | `^12.0.1` | `package.json:40` |
| **Input Validation** | `joi` | `^18.0.1` | `package.json:33` |
| **Payment Gateway** | `midtrans-client` (Snap) | `^1.4.3` | `package.json:35` |
| **Media Storage** | ImageKit SDK (`imagekit`) | `^6.0.0` | `package.json:32` |
| **Email Delivery** | `nodemailer` (Gmail transport) | `^7.0.6` | `package.json:39` |
| **Security Headers** | `helmet` | `^8.3.0` | `package.json:31` |
| **Rate Limiter** | `express-rate-limit` | `^8.5.2` | `package.json:29` |
| **API Docs** | Swagger UI (`swagger-ui-express`) | `^5.0.1` | `package.json:42` |
| **Task Scheduling** | `node-cron` | `^4.6.0` | `package.json:38` |
| **Test Framework** | Jest + Supertest | `^30.4.2` / `^7.2.2` | `package.json:44,48` |

*Unused Dependency Identified:* `express-session@^1.18.2` is present in `package.json:30` but never imported or invoked in any source file.

---

## 4. Repository Structure and Architecture

```
jepretin-backend/
├── app.js                         # Application entry point, Express config, global middlewares
├── package.json                   # Dependencies, scripts
├── jest.config.js                 # Jest test configuration
├── Dockerfile                     # Alpine Node 20 container definition
├── docker-compose.yml             # Local Postgres + App composition
├── AGENTS.md                      # AI agent coding guidelines & endpoint reference
├── prd.MD                         # Product Requirements Document
├── prisma/
│   ├── schema.prisma              # Database schema (30 models, 9 enums)
│   ├── data/
│   │   ├── seed.js                # Core database seeder
│   │   ├── seed-wilayah.js        # Wilayah CSV seeder
│   │   └── *.csv                  # Administrative boundary data files
│   └── migrations/                # 18 migration versions
├── src/
│   ├── docs/swagger.json          # OpenAPI 3.0 specification
│   ├── jobs/cleanup.job.js        # Hourly TokenBlacklist cron cleanup
│   ├── libs/nodemailer.js         # Singleton email transporter
│   ├── middlewares/
│   │   ├── authMiddleware.js      # authenticate() + authorize(...roles)
│   │   ├── multer.js              # Memory storage upload handler (10MB)
│   │   └── validate.js            # Joi schema validation wrapper
│   ├── modules/                   # 12 functional domains
│   │   ├── auth/                  # Register, login, logout, OTP, password recovery
│   │   ├── mailer/                # Mail generation service
│   │   ├── user/                  # User management + CustomerAddress
│   │   ├── wilayah/               # Administrative territories
│   │   ├── provider/              # Provider profile, roles, coverage, portfolio, bundle, topping, availability
│   │   ├── order/                 # Booking creation, lifecycle transitions
│   │   ├── payment/               # Snap transaction, webhook, categories & methods
│   │   ├── wallet/                # Provider balance ledger
│   │   ├── withdrawal/            # Payout requests & admin approval
│   │   ├── review/                # Reviews & rating aggregation
│   │   ├── notification/          # In-app notifications & templates
│   │   └── like/                  # Portfolio bookmarking/likes
│   ├── routes/route.js            # Root router aggregating module routers
│   ├── services/
│   │   ├── prisma.service.js      # PrismaClient singleton
│   │   └── imagekit.service.js    # ImageKit SDK client singleton
│   └── utils/
│       ├── appError.js            # Custom AppError(message, statusCode)
│       ├── handleAsync.js         # Async controller wrapper
│       ├── pagination.js          # parsePagination() query parser
│       └── response.js            # Standardized JSON response envelope
└── tests/                         # Automated test suite (7 files)
```

### Architectural Patterns
- **Layered Flow:** `Router` → `authMiddleware / validate(schema)` → `Controller (handleAsync)` → `Service (static methods, Prisma)` → `Response Helper`.
- **Response Format:**
  - Single/Action: `{ code: 200, message: "...", data: {} }`
  - Paginated List: `{ code: 200, message: "...", data: { total: N, page: N, limit: N, data: [] } }`
  - Error: `{ code: 4xx/500, message: "...", data: { detail: "..." } }`
- **Soft Deletion:** Uniform implementation of `deletedAt DateTime?` across all relational models.

---

## 5. Database and Prisma Model Inventory

The schema defines **30 models** and **9 enums**.

### Enums
1. `UserRole`: `CUSTOMER`, `PROVIDER`, `ADMIN`
2. `ProviderStatus`: `PENDING`, `ACCEPTED`, `REJECTED`
3. `OrderStatus`: `PENDING`, `PAID`, `IN_PROGRESS`, `WAITING_CONFIRMATION`, `COMPLETED`, `CANCELLED`, `EXPIRED`, `REFUNDED`
4. `PaymentStatus`: `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`
5. `PaymentType`: `CUSTOMER_PAYMENT`, `WITHDRAWAL_PAYOUT`, `REFUND`
6. `NotificationType`: `ORDER_STATUS`, `PAYMENT`, `SYSTEM`, `PROMO`, `GREETING`
7. `WalletTransactionType`: `CREDIT`, `DEBIT`
8. `WalletTransactionStatus`: `PENDING`, `SUCCESS`, `FAILED`
9. `WithdrawalStatus`: `PENDING`, `PROCESSING`, `APPROVED`, `PAID`, `REJECTED`

### Models Summary

| Model | Primary Key | Key Attributes / Foreign Keys | Soft Delete | Verification Line |
|---|---|---|---|---|
| `User` | UUID | `name`, `email` (UQ), `password`, `role`, `phone`, `avatar`, `isActive`, `isVerified` | Yes | `schema.prisma:14` |
| `Provider` | UUID | `userId` (UQ, FK), `status`, `experience` | Yes | `schema.prisma:37` |
| `Role` | UUID | `name` (UQ) | Yes | `schema.prisma:63` |
| `ProviderRole` | UUID | `providerId` (FK), `roleId` (FK), `@@unique([providerId, roleId])` | Yes | `schema.prisma:72` |
| `Province` | String (code) | `name` | Yes | `schema.prisma:87` |
| `Regency` | String (code) | `provinceId` (FK), `name` | Yes | `schema.prisma:96` |
| `District` | String (code) | `regencyId` (FK), `name` | Yes | `schema.prisma:109` |
| `Village` | String (code) | `districtId` (FK), `name` | Yes | `schema.prisma:123` |
| `ProviderCoverage` | UUID | `providerId` (FK), `districtId` (FK), `@@unique([providerId, districtId])` | Yes | `schema.prisma:136` |
| `ProviderAvailability`| UUID | `providerId` (FK), `startDate`, `endDate`, `isAvailable` | Yes | `schema.prisma:151` |
| `ProviderPortfolio` | UUID | `providerId` (FK), `mediaUrl`, `mediaId`, `mediaType`, `description` | Yes | `schema.prisma:165` |
| `ProviderBundle` | UUID | `providerId` (FK), `name`, `description`, `price` (Decimal 12,2) | Yes | `schema.prisma:181` |
| `ProviderTopping` | UUID | `providerId` (FK), `name`, `description`, `isStandalone`, `price` (Decimal 12,2) | Yes | `schema.prisma:196` |
| `CustomerAddress` | UUID | `userId` (FK), `villageId` (FK), `addressDetail`, `isPrimary` | Yes | `schema.prisma:212` |
| `Order` | UUID | `userId` (FK), `providerId` (FK), `addressId` (FK), `eventDateTime`, `status`, `totalPrice` | Yes | `schema.prisma:230` |
| `OrderItem` | UUID | `orderId` (FK), `bundleId` (FK, nullable), `price` (Decimal 12,2) | Yes | `schema.prisma:254` |
| `OrderItemTopping` | UUID | `orderItemId` (FK), `toppingId` (FK), `price`, `quantity` | Yes | `schema.prisma:272` |
| `PaymentCategory` | UUID | `name`, `description`, `@@unique([name, deletedAt])` | Yes | `schema.prisma:290` |
| `Payment` | UUID | `orderId` (FK, nullable), `amount`, `platformFee`, `netAmount`, `transactionId` (UQ), `status`, `rawResponse` | Yes | `schema.prisma:303` |
| `PaymentMethod` | UUID | `name`, `provider`, `categoryId` (FK), `@@unique([name, categoryId, deletedAt])` | Yes | `schema.prisma:325` |
| `Review` | UUID | `orderId` (UQ, FK), `userId` (FK), `providerId` (FK), `rating` (Int 1-5), `comment` | Yes | `schema.prisma:341` |
| `Wallet` | UUID | `providerId` (UQ, FK), `currentBalance`, `pendingBalance`, `currency` ("IDR") | Yes | `schema.prisma:359` |
| `WalletTransaction` | UUID | `walletId` (FK), `orderId` (FK), `paymentId` (FK), `withdrawalRequestId` (FK), `amount`, `type`, `status` | Yes | `schema.prisma:376` |
| `WithdrawalRequest` | UUID | `providerId` (FK), `walletId` (FK), `amount`, `bankName`, `bankAccountNumber`, `bankAccountName`, `status` | Yes | `schema.prisma:402` |
| `OtpToken` | UUID | `userId` (UQ, FK), `code` (hashed), `expiresAt`, `isUsed`, `requestCount` | Yes | `schema.prisma:426` |
| `PasswordReset` | UUID | `userId` (FK), `resetToken` (UQ) | Yes | `schema.prisma:444` |
| `TokenBlacklist` | UUID | `token` (UQ), `expiredAt` | Yes | `schema.prisma:456` |
| `NotificationTemplate`| UUID | `title`, `type`, `message` (VarChar 255) | Yes | `schema.prisma:465` |
| `Notification` | UUID | `userId` (FK), `templateId` (FK), `orderId` (FK), `type`, `message`, `isRead` | Yes | `schema.prisma:476` |
| `Like` | UUID | `userId` (FK), `portfolioId` (FK), `@@unique([userId, portfolioId])` | Yes | `schema.prisma:496` |

---

## 6. Entity Relationships and Integrity

- **User ↔ Provider:** 1:1 optional via `userId` foreign key on `Provider` (`schema.prisma:39`). A Customer upgrades to Provider upon Admin approval.
- **Provider ↔ Services:** Providers own `ProviderBundle` (fixed pricing bundles) and `ProviderTopping` (add-on services, either standalone or tied to orders).
- **Order Structure:** An `Order` belongs to a Customer (`userId`) and target `Provider` (`providerId`), tied to a specific `CustomerAddress` (`addressId`). Each Order contains one or more `OrderItem`s, which can have nested `OrderItemTopping` records.
- **Financial Integrity:**
  - `Order` 1:N `Payment`. `Payment.transactionId` maps to Midtrans Snap `order_id`.
  - `Provider` 1:1 `Wallet`.
  - `Wallet` 1:N `WalletTransaction`. Credits are recorded when an order reaches `COMPLETED`. Debits are recorded when a `WithdrawalRequest` is approved.
- **Geographic Hierarchy:** `Province` → `Regency` → `District` → `Village`. Provider service eligibility is matched by comparing `CustomerAddress.village.districtId` against `ProviderCoverage.districtId`.

---

## 7. Complete API Endpoint Inventory

The backend registers **104 routes** grouped into 11 modules under the `/api` prefix.

### 7.1 Auth Module (`/api/auth`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| POST | `/api/auth/register` | None | `{ name, email, password, phone? }` | User registration + TOTP creation |
| POST | `/api/auth/login` | None | `{ email, password }` | Login, returns JWT |
| POST | `/api/auth/logout` | JWT | None (Bearer header) | Blacklists current JWT |
| POST | `/api/auth/otp/verify` | None | `{ email, otpCode }` | Verifies account |
| POST | `/api/auth/otp/resend` | None | `{ email }` | Rate-limited OTP resend |
| POST | `/api/auth/forgot-password`| None | `{ email }` | Dispatches reset token via email |
| POST | `/api/auth/reset-password` | None | `{ token, password, confirmPassword }`| Updates user password |

### 7.2 User Module (`/api/user`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| GET | `/api/user/all-user` | JWT + ADMIN | Query: `{ page, limit }` | Paginated users list |
| GET | `/api/user/get-user` | JWT | None | Current user profile |
| PUT | `/api/user/update-user` | JWT | `{ name?, email?, phone?, avatar?, password? }` | Profile update |
| PUT | `/api/user/update-avatar`| JWT | Multipart: `avatar` file | ImageKit upload avatar |
| DELETE| `/api/user/delete-user` | JWT | None | Soft delete self account |
| POST | `/api/user/address` | JWT | `{ villageId, addressDetail, isPrimary? }` | Create customer address |
| GET | `/api/user/address` | JWT | None | List customer addresses |
| GET | `/api/user/address/:id` | JWT | Params: `id` | Get address by ID |
| PUT | `/api/user/address/:addressId`| JWT | `{ villageId?, addressDetail?, isPrimary? }` | Update address |
| DELETE| `/api/user/address/:id` | JWT | Params: `id` | Soft delete address |

### 7.3 Wilayah Module (`/api/wilayah`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| GET | `/api/wilayah/provinces` | JWT | None | List all provinces |
| GET | `/api/wilayah/regencies/:provinceId` | JWT | Params: `provinceId` | List regencies by province |
| GET | `/api/wilayah/districts/:regencyId` | JWT | Params: `regencyId` | List districts by regency |
| GET | `/api/wilayah/villages/:districtId` | JWT | Params: `districtId` | List villages by district |

### 7.4 Provider Module (`/api/provider` — 40 endpoints)
| Method | Path | Auth / Role | Summary |
|---|---|---|---|
| GET | `/api/provider/search` | JWT | Public provider search (by roleId, districtId, keyword) |
| GET | `/api/provider/all-provider` | JWT + ADMIN | List all providers (paginated) |
| GET | `/api/provider/get-provider` | JWT | Current user's provider profile |
| POST | `/api/provider/provider` | JWT | Register as provider (`experience`, `roles[]`) |
| PUT | `/api/provider/update-provider` | JWT | Re-submit experience if status was REJECTED |
| PUT | `/api/provider/update-status/:id` | JWT + ADMIN | Update status (`PENDING`/`ACCEPTED`/`REJECTED`); creates wallet on ACCEPTED |
| DELETE| `/api/provider/delete-provider` | JWT | Soft delete provider profile |
| POST | `/api/provider/assign-role` | JWT | Link provider to existing role |
| GET | `/api/provider/roles` | JWT | List available provider roles |
| DELETE| `/api/provider/remove-role` | JWT | Unlink provider role |
| POST | `/api/provider/role` | JWT + ADMIN | Create new global role (`name`) |
| PUT | `/api/provider/role/:id` | JWT + ADMIN | Update global role |
| POST | `/api/provider/coverage` | JWT | Add district coverage |
| DELETE| `/api/provider/coverage/:districtId` | JWT | Remove district coverage |
| GET | `/api/provider/coverage` | JWT | List own provider coverages |
| GET | `/api/provider/coverage/:districtId` | JWT | List providers covering a district |
| POST | `/api/provider/portofolio` | JWT | Add portfolio media (multipart up to 10 files) |
| GET | `/api/provider/all-portofolio`| JWT + ADMIN | List all portfolios (paginated) |
| GET | `/api/provider/my-portofolio` | JWT | List own portfolios |
| GET | `/api/provider/get-portofolio/:providerId` | JWT | List provider's portfolios |
| GET | `/api/provider/portofolio-by-location` | JWT | Portfolios filtered by customer's primary address |
| PUT | `/api/provider/portofolio/:id`| JWT | Update portfolio item (multipart 1 file) |
| DELETE| `/api/provider/portofolio/:id`| JWT | Soft delete portfolio |
| POST | `/api/provider/bundle` | JWT | Create service bundle (`name`, `description?`, `price`) |
| GET | `/api/provider/all-bundle` | JWT | List all bundles (paginated) |
| GET | `/api/provider/my-bundle` | JWT | List own bundles (paginated) |
| GET | `/api/provider/bundle/:providerId`| JWT | List bundles for provider |
| PUT | `/api/provider/bundle/:id` | JWT | Update bundle |
| DELETE| `/api/provider/bundle/:id` | JWT | Soft delete bundle |
| POST | `/api/provider/topping` | JWT | Create topping (`name`, `price`, `isStandalone`, `bundleId?`) |
| GET | `/api/provider/all-topping` | JWT | List all toppings (paginated) |
| GET | `/api/provider/my-topping` | JWT | List own toppings (paginated) |
| GET | `/api/provider/topping/:providerId`| JWT | List toppings for provider |
| PUT | `/api/provider/topping/:id` | JWT | Update topping |
| DELETE| `/api/provider/topping/:id` | JWT | Soft delete topping |
| POST | `/api/provider/availability` | JWT | Add schedule availability window |
| GET | `/api/provider/availability` | JWT | List own availability |
| GET | `/api/provider/availability/:id` | JWT | Get single availability window |
| PUT | `/api/provider/availability/:id` | JWT | Update availability |
| DELETE| `/api/provider/availability/:id` | JWT | Soft delete availability |

### 7.5 Order Module (`/api/order`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| POST | `/api/order/order` | JWT | `{ providerId, addressId, eventDateTime, items: [...] }` | Create new order |
| GET | `/api/order/all-order` | JWT + ADMIN | Query: `{ page, limit, status }` | List all orders |
| GET | `/api/order/my-orders` | JWT | Query: `{ page, limit }` | Customer's orders |
| GET | `/api/order/provider-orders` | JWT | Query: `{ page, limit }` | Provider's orders |
| GET | `/api/order/order/:orderId` | JWT | Params: `orderId` | Order detail |
| PUT | `/api/order/order/:orderId` | JWT | `{ status }` | Transition order status |

### 7.6 Payment Module (`/api/payment`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| POST | `/api/payment/payment` | JWT | `{ orderId }` | Generate Midtrans Snap transaction & redirect URL |
| POST | `/api/payment/webhook` | None | Midtrans webhook payload | Webhook callback handler |
| GET | `/api/payment/my-payment` | JWT | Query: `{ page, limit }` | List customer payments |
| GET | `/api/payment/payment/:id` | JWT | Params: `id` | Get single payment detail |
| POST | `/api/payment/category` | JWT + ADMIN | `{ name, description? }` | Create payment category |
| GET | `/api/payment/category` | JWT | None | List payment categories |
| PUT | `/api/payment/category/:id`| JWT + ADMIN | `{ name, description? }` | Update payment category |
| DELETE| `/api/payment/category/:id`| JWT + ADMIN | Params: `id` | Soft delete category |
| POST | `/api/payment/method` | JWT + ADMIN | `{ name, provider?, categoryId }` | Create payment method |
| GET | `/api/payment/method` | JWT | None | List payment methods |
| PUT | `/api/payment/method/:id` | JWT + ADMIN | `{ name?, provider?, categoryId? }` | Update method |
| DELETE| `/api/payment/method/:id` | JWT + ADMIN | Params: `id` | Soft delete method |

### 7.7 Wallet Module (`/api/wallet`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| GET | `/api/wallet/wallet` | JWT | None | Current provider wallet balance |
| POST | `/api/wallet/update-balance`| JWT + ADMIN | `{ walletId, amount, type: "CREDIT"\|"DEBIT" }` | Admin manual balance update |

### 7.8 Withdrawal Module (`/api/withdrawal`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| POST | `/api/withdrawal/request` | JWT | `{ amount, bankName, bankAccountNumber, bankAccountName }` | Provider payout request |
| GET | `/api/withdrawal/my-requests` | JWT | Query: `{ page, limit }` | Provider's request history |
| GET | `/api/withdrawal/all-requests`| JWT + ADMIN | Query: `{ page, limit }` | Admin view all requests |
| GET | `/api/withdrawal/:id` | JWT | Params: `id` | Withdrawal request detail |
| PUT | `/api/withdrawal/:id/approve` | JWT + ADMIN | Params: `id`, `{ note? }` | Approve payout |
| PUT | `/api/withdrawal/:id/reject` | JWT + ADMIN | Params: `id`, `{ note }` | Reject payout (refunds balance) |

### 7.9 Review Module (`/api/review`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| POST | `/api/review/review` | JWT | `{ orderId, rating, comment? }` | Create review for completed order |
| GET | `/api/review/my-reviews` | JWT | Query: `{ page, limit }` | Customer's submitted reviews |
| GET | `/api/review/provider-reviews`| JWT | None | Provider's received reviews |
| GET | `/api/review/provider/:providerId`| JWT | Params: `providerId` | Public provider reviews |
| GET | `/api/review/:id` | JWT | Params: `id` | Review detail |
| PUT | `/api/review/:id` | JWT | `{ rating?, comment? }` | Update review |
| DELETE| `/api/review/:id` | JWT | Params: `id` | Soft delete review |

### 7.10 Notification Module (`/api/notification`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| GET | `/api/notification` | JWT | Query: `{ page, limit }` | Paginated notifications list |
| GET | `/api/notification/unread-count`| JWT | None | Unread notifications count |
| PUT | `/api/notification/:id/read` | JWT | Params: `id` | Mark notification as read |
| PUT | `/api/notification/read-all` | JWT | None | Mark all notifications read |
| POST | `/api/notification/template` | JWT + ADMIN | `{ title, type, message }` | Create notification template |
| GET | `/api/notification/template` | JWT | None | List notification templates |
| GET | `/api/notification/template/:id` | JWT | Params: `id` | Get template by ID |
| PUT | `/api/notification/template/:id` | JWT + ADMIN | `{ title?, type?, message? }` | Update template |
| DELETE| `/api/notification/template/:id` | JWT + ADMIN | Params: `id` | Soft delete template |

### 7.11 Like Module (`/api/like`)
| Method | Path | Auth / Role | Request Payload | Summary |
|---|---|---|---|---|
| POST | `/api/like/toggle` | JWT | `{ portfolioId }` | Toggle like/bookmark on portfolio |
| GET | `/api/like/count/:portfolioId`| JWT | Params: `portfolioId` | Likes count for portfolio |
| GET | `/api/like/my-likes` | JWT | None | User's liked portfolios |

---

## 8. Authentication and Authorization

### Mechanism
- **Token Generation:** `AuthService.login` issues HS256 signed JWTs containing `{ id, email, role }` with a 5-hour expiration (`auth.service.js:41`).
- **Authentication Middleware:** `authMiddleware.authenticate` extracts `Bearer` token from `Authorization` header, verifies validity, and checks `TokenBlacklist` database table (`authMiddleware.js:15-18`).
- **Authorization Middleware:** `authMiddleware.authorize(...roles)` checks `req.user.role` against required roles (`authMiddleware.js:26-33`).
- **Logout / Invalidation:** `AuthService.logout` saves the decoded token and expiry time into `TokenBlacklist` (`auth.service.js:58-64`). An hourly cron job (`cleanup.job.js:7-13`) deletes expired blacklist records.

### Vulnerabilities & Deviations
1. **Email Enumeration:** `PasswordService.forgotPassword` returns HTTP 404 when an email is not registered (`password.service.js:12`), allowing attackers to discover registered users.
2. **Unhandled JWT Malformed in Password Reset:** `PasswordService.resetPassword` does not wrap `jwt.verify` in a try-catch block (`password.service.js:35`). An invalid or malformed token triggers an unhandled `JsonWebTokenError` caught by the global error handler, resulting in an HTTP 500 error instead of HTTP 400.
3. **Password Change without Old Password:** `UserService.updateUser` allows changing the user's password without prompting for their existing password (`user.service.js:76-78`).
4. **Email Change without Verification:** Changing an email via `UserService.updateUser` does not mark `isVerified = false` or initiate a new OTP verification workflow (`user.service.js:72`).

---

## 9. Business Workflow Analysis

### 9.1 Provider Onboarding Workflow
1. Customer registers (`/api/auth/register`) and verifies email via OTP (`/api/auth/otp/verify`).
2. User submits provider application (`/api/provider/provider`) providing portfolio/experience URL and role IDs (`Photographer`, `Videographer`, or `MUA`). `Provider` status is initialized as `PENDING`.
3. Admin reviews all applications (`/api/provider/all-provider`) and accepts or rejects (`/api/provider/update-status/:id`).
4. When accepted:
   - Provider status transitions to `ACCEPTED`.
   - `User.role` is updated to `PROVIDER`.
   - A `Wallet` record is automatically initialized with `currentBalance = 0` (`provider.service.js:304-315`).
   - Acceptance notification is dispatched to the user.

### 9.2 Bundle and Topping Rules
- **Bundles:** Providers define bundle packages (`ProviderBundle`) with a required positive price. Each bundle belongs to one provider.
- **Toppings:** Add-on services (`ProviderTopping`) can be configured as `isStandalone = true` or `false`.
  - In `providerTopping.service.js:38-52`, non-standalone toppings require validation against a valid `bundleId`.
  - **Defect Identified:** In `providerTopping.service.js:54-62`, `bundleId` is validated in the request body but never persisted to the database because the `ProviderTopping` Prisma model does not contain a `bundleId` field. Toppings are associated with bundles at order placement time via `OrderItemTopping`.
- **Order Price Verification:** Server-side price calculation is strictly enforced in `OrderService.addOrder` (`order.service.js:84-180`). Prices sent from clients are discarded; bundle prices are loaded from `ProviderBundle.price` and topping prices from `ProviderTopping.price`.

---

## 10. Booking and Order Lifecycle

### State Machine Transition Rules
Enforced in `OrderService.updateOrderStatus` (`order.service.js:332-341`):

```
       [Customer Creates]
              │
              ▼
           PENDING ──(Customer cancels)──► CANCELLED
              │
    (Midtrans Webhook SUCCESS)
              │
              ▼
            PAID ──(Provider accepts)──► IN_PROGRESS
                                               │
                                      (Provider finishes)
                                               │
                                               ▼
   COMPLETED ◄──(Customer confirms)── WAITING_CONFIRMATION
```

- **Customer Permissions:** Can transition `PENDING → CANCELLED` and `WAITING_CONFIRMATION → COMPLETED`.
- **Provider Permissions:** Can transition `PAID → IN_PROGRESS` and `IN_PROGRESS → WAITING_CONFIRMATION`.
- **Admin Permissions:** Can override status to any valid state (`order.service.js:353`).
- **Conflict Prevention:** `OrderService.addOrder` validates that `eventDateTime` falls within the provider's active availability window (`ProviderAvailability.isAvailable = true`) (`order.service.js:53-68`).
- **Financial Settlement Trigger:** When an order transitions to `COMPLETED`:
  - `OrderService.updateOrderStatus` fetches the `SUCCESS` payment for the order.
  - The provider's wallet is credited with `payment.netAmount || payment.amount`.
  - A `WalletTransaction` with type `CREDIT` and status `SUCCESS` is recorded inside the Prisma interactive transaction (`order.service.js:446-481`).

---

## 11. Payment and Webhook Behavior

### Payment Flow
1. Customer initiates payment via `POST /api/payment/payment` with `{ orderId }`.
2. Backend verifies order status is `PENDING` and caller is the order owner (`payment.service.js:14-25`).
3. Backend creates Midtrans Snap transaction via `midtransClient.Snap.createTransaction`.
4. Snap token and redirect URL are stored in `Payment` record and returned to client (`payment.service.js:53-83`).

### Webhook Handling (`POST /api/payment/webhook`)
- **Signature Verification:** Recomputes SHA-512 hash over `${order_id}${status_code}${gross_amount}${MIDTRANS_SERVER_KEY}` and compares against Midtrans `signature_key` payload (`payment.service.js:93-108`).
- **Status Mapping:**
  - `settlement` / `capture` (accept) → `PaymentStatus.SUCCESS`, `OrderStatus.PAID`.
  - `cancel` / `deny` / `expire` → `PaymentStatus.FAILED`.
  - `pending` → `PaymentStatus.PENDING`.
- **Race Condition & Idempotency Flaw:**
  - `PaymentService.handleWebhook` (`payment.service.js:91-187`) is **NOT executed within a Prisma transaction**.
  - There is no status guard checking if the payment is already `SUCCESS`. Duplicate webhooks will execute duplicate `Order.update` and duplicate `Notification.create` queries.

---

## 12. Wallet, Withdrawal, and Refund Behavior

### Wallet Balance Management
- `Wallet` tracks `currentBalance` (available funds) and `pendingBalance` (funds reserved during withdrawal).
- **Withdrawal Request:**
  - Minimum withdrawal amount: IDR 10,000 (`withdrawal.validation.js:7`).
  - Request deducts `amount` from `currentBalance` and adds it to `pendingBalance` in an interactive transaction (`withdrawal.service.js:37-47`).
  - A `WalletTransaction` of type `DEBIT` with status `PENDING` is recorded.
- **Admin Approval:**
  - Admin approves via `PUT /api/withdrawal/:id/approve`.
  - Deducts `amount` from `pendingBalance`, marks request `APPROVED`, updates transaction status to `SUCCESS` (`withdrawal.service.js:269-298`).
- **Admin Rejection:**
  - Admin rejects via `PUT /api/withdrawal/:id/reject`.
  - Refunds `amount` back to `currentBalance`, marks request `REJECTED`, updates original debit transaction to `FAILED`, and records a new `CREDIT` refund transaction (`withdrawal.service.js:345-385`).

---

## 13. Security and Reliability Findings

### Severity Classification

| Finding ID | Severity | Title | Location | Description |
|---|---|---|---|---|
| **BE-SEC-01** | **P1 (High)** | Non-atomic payment webhook & missing idempotency | `payment.service.js:91-187` | Webhook operations run outside `$transaction` with no duplicate execution check. Duplicate webhooks trigger repeated order state updates and notifications. |
| **BE-SEC-02** | **P1 (High)** | Unhandled JWT verify exception in password reset | `password.service.js:35` | Malformed or expired reset tokens cause unhandled exceptions leading to HTTP 500 server crashes instead of HTTP 400 client errors. |
| **BE-SEC-03** | **P2 (Med)** | Missing challenge on sensitive account updates | `user.service.js:72,76` | Password changes do not verify current password; email changes do not require email re-verification. |
| **BE-SEC-04** | **P2 (Med)** | User enumeration via password recovery | `password.service.js:11-13` | Endpoint returns 404 on unknown emails, enabling username enumeration. |
| **BE-SEC-05** | **P2 (Med)** | Duplicate active payments for single order | `payment.service.js:13-33` | Calling `POST /api/payment/payment` multiple times for the same order creates redundant payment rows with duplicate Snap tokens. |
| **BE-SEC-06** | **P3 (Low)** | Unused session package in production bundle | `package.json:30` | `express-session` is installed as a production dependency but never used in any source file. |
| **BE-SEC-07** | **P3 (Low)** | Missing route-level authorization guards | `provider.routes.js:80-140` | Certain provider sub-resource routes only check `authenticate` rather than `authorize(PROVIDER)`. |

---

## 14. Testing and Observed Results

### Test Execution Details
- **Command:** `npm test` (`jest --config jest.config.js --no-cache --detectOpenHandles --forceExit`)
- **Execution Date:** 2026-10-11
- **Target Environment:** Node 20, PostgreSQL test database via `.env.test`
- **Result:** **PASSED (100%)**
- **Test Suites:** 5 passed, 5 total
- **Tests Total:** 48 passed, 48 total
- **Time Elapsed:** 30.014 seconds

### Breakdown by Test Suite
1. `tests/auth.test.js`: 8 tests passed (Registration, duplicate email check, unverified login block, verified login, auth guard, logout token blacklist, password recovery).
2. `tests/crud.test.js`: 6 tests passed (Order creation, my-orders query, provider-orders query, order cancellation, payment initialization mock, provider wallet query).
3. `tests/webhook.test.js`: 5 tests passed (Settlement status update to PAID, invalid signature rejection with 403, unknown order 404, cancel status to FAILED, deny status to FAILED).
4. `tests/review.test.js`: 8 tests passed (Review submission on completed order, duplicate review prevention, customer reviews, provider reviews & average rating, review detail, review update, soft deletion).
5. `tests/integration.test.js`: 21 tests passed (Withdrawal lifecycle, notification template CRUD, portfolio like toggle and counting, provider schedule availability, provider role management).

---

## 15. Deployment and Operational Configuration

- **Dockerization:** `Dockerfile` packages the service on `node:20-alpine`. Dependencies installed with `--omit=dev`. Runs `npx prisma generate` during build and starts with `node app.js`.
- **Container Composition:** `docker-compose.yml` launches `postgres:16-alpine` (healthcheck via `pg_isready`) and the application container. The app waits for database readiness and executes `npx prisma migrate deploy` prior to launching.
- **Environment Safety:** `app.js:14-31` validates 10 mandatory environment variables on boot and calls `process.exit(1)` if any are missing.
- **Rate Limiting:** Global rate limit of 100 requests per 15 minutes per IP (`app.js:69-82`), automatically exempting the Midtrans webhook route `/api/payment/webhook`.

---

## 16. Feature Implementation Status Matrix

| Module / Feature | Verified Status | Evidence | Notes |
|---|---|---|---|
| Customer Registration & TOTP | VERIFIED | `register.service.js`, `otp.service.js` | Full email TOTP delivery & verification |
| User Login & Token Blacklisting | VERIFIED | `auth.service.js`, `cleanup.job.js` | JWT issued (5h), token blacklist on logout |
| Customer Address Management | VERIFIED | `userAddress.service.js` | Full Indonesian village/district/regency linking |
| Administrative Territories | VERIFIED | `wilayah.service.js` | Complete Indonesian administrative lookup |
| Provider Application & Approval | VERIFIED | `provider.service.js:269-368` | Multi-role assignment, wallet creation on ACCEPTED |
| Provider Schedule Availability | VERIFIED | `providerAvailability.service.js` | Start/end date validation |
| Provider Coverage Areas | VERIFIED | `providerCoverage.service.js` | District-level matching |
| Portfolio & ImageKit Upload | VERIFIED | `providerPortofolio.service.js`, `multer.js` | Memory storage, multipart upload |
| Service Bundles CRUD | VERIFIED | `providerBundle.service.js` | Server-validated price calculation |
| Service Toppings CRUD | PARTIALLY VERIFIED | `providerTopping.service.js` | `bundleId` validated but not stored in DB schema |
| Order Creation & Scheduling | VERIFIED | `order.service.js:7-200` | Checks coverage, availability conflicts, price snapshot |
| Order Status State Machine | VERIFIED | `order.service.js:331-488` | Role-enforced lifecycle transitions |
| Midtrans Snap Integration | VERIFIED | `payment.service.js:8-89` | Generates valid Snap payment tokens |
| Payment Webhook Verification | PARTIALLY VERIFIED | `payment.service.js:91-187` | Signature verified, but lacks transaction & idempotency |
| Provider Wallet & Earnings | VERIFIED | `order.service.js:446-481`, `wallet.service.js` | Credits net earnings on order completion |
| Provider Withdrawal Flow | VERIFIED | `withdrawal.service.js` | Pending balance reservation, admin approve/reject |
| Customer Reviews & Ratings | VERIFIED | `review.service.js` | Gated on COMPLETED orders, calculates average rating |
| In-App Notifications | VERIFIED | `notification.service.js` | Triggered automatically on order, payment, withdrawal events |
| Portfolio Likes / Bookmarks | PARTIALLY VERIFIED | `like.service.js` | Toggling creates or soft-deletes records |

---

## 17. Technical Debt and Risks

1. **Unpaginated List Endpoints:** `ReviewService.getProviderReviews`, `ReviewService.getReviewsByProviderId`, `ProviderCoverageService.getProviderCoverage`, `ProviderRoleService.getRoles`, and `NotificationTemplateService.getTemplates` return raw collections without pagination parameters, violating `AGENTS.md` conventions.
2. **Controller DB Access Violation:** `WalletController.getMyWallet` (`wallet.controller.js:9`) queries `prisma.provider.findUnique` directly in the controller instead of calling `WalletService`.
3. **Redundant Database Query:** `ProviderPortofolioService.getPortofolioById` executes two redundant database queries to load portfolios (`providerPortofolio.service.js:136,145`).
4. **Soft-Delete Bundle Uniqueness Conflict:** `ProviderBundleService.createBundle` does not filter `deletedAt: null` when checking for duplicate names, causing previously soft-deleted bundle names to permanently block new bundles with the same name.

---

## 18. Prioritized Actionable Recommendations

### Priority 0 (Critical / Data Integrity)
- **BE-001 (P0): Wrap Webhook Handler in Prisma Transaction & Add Idempotency Guard**
  - *Location:* `src/modules/payment/services/payment.service.js:91-187`
  - *Action:* Wrap payment update, order update, and notification inside `prisma.$transaction()`. Guard with `if (payment.status === "SUCCESS") return;`.

### Priority 1 (High / Essential Reliability)
- **BE-002 (P1): Catch Malformed Token Exception in Password Reset**
  - *Location:* `src/modules/auth/services/password.service.js:35`
  - *Action:* Wrap `jwt.verify` in a try-catch block and throw `new AppError("Token tidak valid atau kadaluarsa", 400)`.
- **BE-003 (P1): Enforce Single Active Payment Per Order**
  - *Location:* `src/modules/payment/services/payment.service.js:14`
  - *Action:* Check for existing `Payment` in status `PENDING` before requesting a new Snap transaction. Return existing token if valid.

### Priority 2 (Medium / Maintainability & Conventions)
- **BE-004 (P2): Implement Pagination for Remaining List Endpoints**
  - *Location:* `review.service.js`, `providerCoverage.service.js`, `notificationTemplate.service.js`
  - *Action:* Integrate `parsePagination(query)` into all remaining list endpoints.
- **BE-005 (P2): Clean up Controller Violation in Wallet Module**
  - *Location:* `src/modules/wallet/controllers/wallet.controller.js:9`
  - *Action:* Move `prisma.provider.findUnique` into `WalletService.getWalletByUserId`.

---

## 19. Important Source File References

- Application Configuration: `app.js:1-117`
- Routing Mounts: `src/routes/route.js:1-29`
- Order State Machine: `src/modules/order/services/order.service.js:331-488`
- Payment & Webhook: `src/modules/payment/services/payment.service.js:8-187`
- Withdrawal Ledger: `src/modules/withdrawal/services/withdrawal.service.js:6-407`
- Authentication & Blacklisting: `src/middlewares/authMiddleware.js:1-36`
- Database Schema: `prisma/schema.prisma:1-573`
- Automated Test Suite: `tests/setup.js`, `tests/crud.test.js`, `tests/webhook.test.js`

---

## 20. Audit Limitations

- External third-party integrations (Midtrans Production environment, ImageKit live storage CDN, Gmail live SMTP delivery) were verified via unit mocks, sandbox configurations, and code review rather than live production API calls.
- Wilayah administrative boundaries rely on pre-seeded CSV fixtures in `prisma/data/`. Live EMSIFA API scraping was not executed during this audit.
