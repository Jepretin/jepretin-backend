-- ============================================================
-- READABLE VIEWS — untuk debugging di pgAdmin
-- Setiap view menampilkan nama/human-readable values selain UUID FK
-- ============================================================

-- 1. Order → User + Provider + Address (5 level nested location)
CREATE OR REPLACE VIEW v_order AS
SELECT
  o.id,
  o."eventDateTime",
  o.status,
  o."totalPrice",
  o."createdAt",
  o."updatedAt",
  o."deletedAt",
  -- Customer
  u.name  AS customer_name,
  u.email AS customer_email,
  u.phone AS customer_phone,
  -- Provider
  pu.name AS provider_name,
  pu.email AS provider_email,
  p.status AS provider_status,
  -- Address chain
  ca."addressDetail" AS address_detail,
  ca."isPrimary"    AS address_is_primary,
  v.name  AS village_name,
  d.name  AS district_name,
  r.name  AS regency_name,
  pr.name AS province_name
FROM "Order" o
JOIN "User" u          ON u.id = o."userId"
JOIN "Provider" p      ON p.id = o."providerId"
JOIN "User" pu         ON pu.id = p."userId"
JOIN "CustomerAddress" ca ON ca.id = o."addressId"
JOIN "Village" v       ON v.id = ca."villageId"
JOIN "District" d      ON d.id = v."districtId"
JOIN "Regency" r       ON r.id = d."regencyId"
JOIN "Province" pr     ON pr.id = r."provinceId";


-- 2. Payment → Order → User
CREATE OR REPLACE VIEW v_payment AS
SELECT
  pm.id,
  pm."transactionId",
  pm.amount,
  pm."platformFee",
  pm."netAmount",
  pm."paymentType",
  pm.status,
  pm."paidAt",
  pm."createdAt",
  pm."updatedAt",
  pm."deletedAt",
  -- Order info
  o.id          AS order_id,
  o.status      AS order_status,
  o."totalPrice" AS order_total_price,
  -- Customer
  u.name  AS customer_name,
  u.email AS customer_email
FROM "Payment" pm
LEFT JOIN "Order" o ON o.id = pm."orderId"
LEFT JOIN "User" u  ON u.id = o."userId";


-- 3. Review → User (customer) + Provider → User (provider) + Order
CREATE OR REPLACE VIEW v_review AS
SELECT
  rv.id,
  rv.rating,
  rv.comment,
  rv."createdAt",
  rv."updatedAt",
  rv."deletedAt",
  -- Customer
  cu.name  AS customer_name,
  cu.email AS customer_email,
  -- Provider
  pu.name AS provider_name,
  pu.email AS provider_email,
  -- Order
  o.id     AS order_id,
  o.status AS order_status,
  o."eventDateTime" AS order_event_date
FROM "Review" rv
JOIN "User" cu      ON cu.id = rv."userId"
JOIN "Provider" p   ON p.id = rv."providerId"
JOIN "User" pu      ON pu.id = p."userId"
JOIN "Order" o      ON o.id = rv."orderId";


-- 4. WalletTransaction → Wallet → Provider → User + Order + Payment + WithdrawalRequest
CREATE OR REPLACE VIEW v_wallet_transaction AS
SELECT
  wt.id,
  wt.amount,
  wt.type,
  wt.status,
  wt.description,
  wt."externalTxId",
  wt."retryCount",
  wt."lastAttemptAt",
  wt."createdAt",
  wt."updatedAt",
  wt."deletedAt",
  -- Provider
  pu.name  AS provider_name,
  pu.email AS provider_email,
  -- Wallet
  w."currentBalance" AS wallet_balance,
  -- Order
  o.id     AS order_id,
  o.status AS order_status,
  -- Payment
  pm."transactionId" AS payment_transaction_id,
  pm.status          AS payment_status,
  -- Withdrawal
  wr.status AS withdrawal_status,
  wr.amount AS withdrawal_amount
FROM "WalletTransaction" wt
JOIN "Wallet" w          ON w.id = wt."walletId"
JOIN "Provider" p        ON p.id = w."providerId"
JOIN "User" pu           ON pu.id = p."userId"
LEFT JOIN "Order" o      ON o.id = wt."orderId"
LEFT JOIN "Payment" pm   ON pm.id = wt."paymentId"
LEFT JOIN "WithdrawalRequest" wr ON wr.id = wt."withdrawalRequestId";


-- 5. WithdrawalRequest → Provider → User + Wallet
CREATE OR REPLACE VIEW v_withdrawal_request AS
SELECT
  wr.id,
  wr.amount,
  wr."bankName",
  wr."bankAccountNumber",
  wr."bankAccountName",
  wr.status,
  wr."attemptedAt",
  wr."attemptCount",
  wr.note,
  wr."createdAt",
  wr."updatedAt",
  wr."deletedAt",
  -- Provider
  pu.name  AS provider_name,
  pu.email AS provider_email,
  -- Wallet
  w."currentBalance" AS wallet_balance,
  w."pendingBalance" AS wallet_pending_balance,
  w.currency         AS wallet_currency
FROM "WithdrawalRequest" wr
JOIN "Provider" p   ON p.id = wr."providerId"
JOIN "User" pu      ON pu.id = p."userId"
JOIN "Wallet" w     ON w.id = wr."walletId";


-- 6. Notification → User + Order
CREATE OR REPLACE VIEW v_notification AS
SELECT
  n.id,
  n.type,
  n.message,
  n."isRead",
  n."createdAt",
  n."updatedAt",
  n."deletedAt",
  -- User
  u.name  AS user_name,
  u.email AS user_email,
  -- Order
  o.id     AS order_id,
  o.status AS order_status,
  -- Template
  nt.title AS template_title
FROM "Notification" n
JOIN "User" u              ON u.id = n."userId"
LEFT JOIN "Order" o        ON o.id = n."orderId"
LEFT JOIN "NotificationTemplate" nt ON nt.id = n."templateId";


-- 7. CustomerAddress → User + Village → District → Regency → Province
CREATE OR REPLACE VIEW v_customer_address AS
SELECT
  ca.id,
  ca."addressDetail",
  ca."isPrimary",
  ca."createdAt",
  ca."updatedAt",
  ca."deletedAt",
  -- User
  u.name  AS user_name,
  u.email AS user_email,
  -- Location chain
  v.name  AS village_name,
  d.name  AS district_name,
  r.name  AS regency_name,
  pr.name AS province_name
FROM "CustomerAddress" ca
JOIN "User" u      ON u.id = ca."userId"
JOIN "Village" v   ON v.id = ca."villageId"
JOIN "District" d  ON d.id = v."districtId"
JOIN "Regency" r   ON r.id = d."regencyId"
JOIN "Province" pr ON pr.id = r."provinceId";


-- 8. ProviderCoverage → Provider → User + District → Regency → Province
CREATE OR REPLACE VIEW v_provider_coverage AS
SELECT
  pc.id,
  pc."createdAt",
  pc."updatedAt",
  pc."deletedAt",
  -- Provider
  pu.name  AS provider_name,
  pu.email AS provider_email,
  p.status AS provider_status,
  -- Location chain
  d.name  AS district_name,
  r.name  AS regency_name,
  pr.name AS province_name
FROM "ProviderCoverage" pc
JOIN "Provider" p   ON p.id = pc."providerId"
JOIN "User" pu      ON pu.id = p."userId"
JOIN "District" d   ON d.id = pc."districtId"
JOIN "Regency" r    ON r.id = d."regencyId"
JOIN "Province" pr  ON pr.id = r."provinceId";


-- 9. Like → User + ProviderPortfolio → Provider → User
CREATE OR REPLACE VIEW v_like AS
SELECT
  l.id,
  l."createdAt",
  l."updatedAt",
  l."deletedAt",
  -- User who liked
  u.name  AS user_name,
  u.email AS user_email,
  -- Portfolio
  pf.id        AS portfolio_id,
  pf."mediaUrl" AS portfolio_media_url,
  pf."mediaType" AS portfolio_media_type,
  pf.description AS portfolio_description,
  -- Portfolio owner (provider)
  pu.name AS provider_name,
  pu.email AS provider_email
FROM "Like" l
JOIN "User" u                 ON u.id = l."userId"
JOIN "ProviderPortfolio" pf   ON pf.id = l."portfolioId"
JOIN "Provider" p             ON p.id = pf."providerId"
JOIN "User" pu                ON pu.id = p."userId";


-- 10. ProviderRole → Provider → User + Role
CREATE OR REPLACE VIEW v_provider_role AS
SELECT
  pr.id,
  pr."createdAt",
  pr."updatedAt",
  pr."deletedAt",
  -- Provider
  pu.name  AS provider_name,
  pu.email AS provider_email,
  p.status AS provider_status,
  -- Role
  r.name AS role_name
FROM "ProviderRole" pr
JOIN "Provider" p  ON p.id = pr."providerId"
JOIN "User" pu     ON pu.id = p."userId"
JOIN "Role" r      ON r.id = pr."roleId";
