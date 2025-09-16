// src/modules/auth/services/otp.service.js
const bcrypt = require("bcrypt");
const { totp } = require("otplib");
const prisma = require("../../../services/prisma.service");
const MailerService = require("../../mailer/mailer.service");

totp.options = { step: 60 }; // OTP berlaku 60 detik

class OtpService {
  static async generateOtp({
    userId,
    email,
    userAgent,
    prismaClient = prisma,
  }) {
    const otpCode = totp.generate(email);
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    const otpRecord = await prismaClient.otpToken.create({
      data: {
        userId,
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 60 * 1000),
        requestCount: 1,
        requestResetAt: new Date(Date.now() + 60 * 1000),
        lastRequestedAt: new Date(),
        userAgent: userAgent || null,
      },
    });

    await MailerService.sendOtpEmail(email, otpCode);
    return otpRecord;
  }

  static async verifyOtp({ email, otpCode }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User tidak ditemukan.");

    const userId = user.id;

    const otpRecord = await prisma.otpToken.findFirst({
      where: { userId, isUsed: false },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      throw new Error("Kode OTP tidak valid atau telah kedaluwarsa.");
    }

    const isValidOtp = await bcrypt.compare(otpCode, otpRecord.code);
    if (!isValidOtp) throw new Error("Kode OTP salah.");

    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: "GREETING",
        message: `Selamat datang di aplikasi, ${user.name}!`,
        isRead: false,
      },
    });

    return { updatedUser };
  }

  static async resendOtp({ email, userAgent }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User tidak ditemukan.");

    const existingOtp = await prisma.otpToken.findFirst({
      where: { userId: user.id, isUsed: false },
    });

    let requestCount = 1;
    let requestResetAt = new Date(Date.now() + 60 * 1000);

    if (existingOtp) {
      if (
        existingOtp.requestResetAt &&
        existingOtp.requestResetAt > new Date()
      ) {
        throw new Error("Silakan tunggu sebelum meminta OTP lagi.");
      }

      if (existingOtp.requestCount >= 5) {
        requestCount = 1;
        requestResetAt = new Date(Date.now() + 60 * 1000);
      } else {
        requestCount = existingOtp.requestCount + 1;
        requestResetAt =
          requestCount >= 5
            ? new Date(Date.now() + 10 * 60 * 1000)
            : new Date(Date.now() + 60 * 1000);
      }
    }

    // Buat OTP baru
    const otpCode = totp.generate(email);
    const hashedOtp = await bcrypt.hash(otpCode, 10);

    const otpRecord = await prisma.otpToken.upsert({
      where: { userId: user.id },
      update: {
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 60 * 1000),
        isUsed: false,
        requestCount,
        requestResetAt,
        lastRequestedAt: new Date(),
        userAgent: userAgent || null,
      },
      create: {
        userId: user.id,
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 60 * 1000),
        isUsed: false,
        requestCount: 1,
        requestResetAt: new Date(Date.now() + 60 * 1000),
        lastRequestedAt: new Date(),
        userAgent: userAgent || null,
      },
    });

    // Kirim OTP ke email
    await MailerService.sendOtpEmail(email, otpCode);

    return { otpRecord };
  }
}

module.exports = OtpService;
