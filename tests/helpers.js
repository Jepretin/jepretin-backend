require("dotenv").config({ path: ".env.test" });

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:root@localhost:5432/jepretin_test?schema=public";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key-jepretin";
process.env.MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "test-midtrans-server-key";

const request = require("supertest");
const { PrismaClient } = require("@prisma/client");

// Mock nodemailer
const nodemailer = require("nodemailer");
nodemailer.createTransport = function () {
  return {
    sendMail: function (opts, cb) {
      if (cb) cb(null, { messageId: "test-msg-id" });
      return Promise.resolve({ messageId: "test-msg-id" });
    },
  };
};

// Mock midtrans-client
require.cache[require.resolve("midtrans-client")] = {
  exports: {
    Snap: function () {
      this.createTransaction = function () {
        return Promise.resolve({
          token: "test-snap-token-" + Date.now(),
          redirect_url: "https://app.midtrans.com/snap/v2/vtweb/test-redirect-url",
        });
      };
    },
  },
};

const app = require("../app");

const prisma = new PrismaClient();

function api() {
  return request(app);
}

async function registerUser(data = {}) {
  const defaults = {
    name: "Test User",
    email: `test-${Date.now()}@gmail.com`,
    password: "123456",
    phone: "081234567890",
  };
  return api().post("/api/auth/register").send({ ...defaults, ...data });
}

async function verifyOtp(email, otpCode = "123456") {
  return api().post("/api/auth/otp/verify").send({ email, otpCode });
}

async function loginUser(email, password = "123456") {
  return api().post("/api/auth/login").send({ email, password });
}

async function getToken(email, password = "123456") {
  const res = await loginUser(email, password);
  return res.body.data.token;
}

async function createTestUserAndToken() {
  const email = `test-full-${Date.now()}@gmail.com`;

  await registerUser({ email, password: "123456" });

  const otp = await prisma.otpToken.findFirst({
    where: { user: { email } },
    orderBy: { createdAt: "desc" },
  });
  if (otp) {
    await prisma.otpToken.update({
      where: { id: otp.id },
      data: { code: "$2b$10$...", isUsed: false },
    });
  }
  await prisma.user.update({ where: { email }, data: { isVerified: true } });

  const token = await getToken(email);

  return { token, email };
}

async function registerAndAcceptProvider(token, roleIds = []) {
  const res = await api()
    .post("/api/provider/provider")
    .set("Authorization", `Bearer ${token}`)
    .send({
      experience: "https://portfolio.example.com/test",
      roles: roleIds.length > 0 ? roleIds : [],
    });

  return res.body.data;
}

async function cleanup() {
  const tables = [
    "WalletTransaction", "Wallet", "WithdrawalRequest",
    "Payment", "Review",
    "OrderItemTopping", "OrderItem", "Order", "Notification",
    "Like",
    "ProviderAvailability", "ProviderTopping", "ProviderBundle",
    "ProviderPortfolio", "ProviderCoverage", "ProviderRole", "Provider",
    "OtpToken", "PasswordReset",
    "CustomerAddress",
    "TokenBlacklist",
  ];

  for (const table of tables) {
    try { await prisma[table[0].toLowerCase() + table.slice(1)].deleteMany(); } catch (e) {}
  }

  try {
    await prisma.user.updateMany({ data: { role: "CUSTOMER" } });
    await prisma.user.deleteMany();
  } catch (e) {}
}

module.exports = { api, registerUser, verifyOtp, loginUser, getToken, createTestUserAndToken, registerAndAcceptProvider, cleanup, prisma };
