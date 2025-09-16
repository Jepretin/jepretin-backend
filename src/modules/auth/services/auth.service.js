const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { totp } = require("otplib"); // Import otplib
const { PrismaClient } = require("@prisma/client");
const prisma = require("../../../services/prisma.service");
const { error } = require("../../../utils/response");
const SECRET_KEY = process.env.JWT_SECRET;

class AuthService {
  static async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      throw new Error("Email atau password salah");
    }

    if (!user.isVerified) {
      throw new Error(
        "Akun belum terverifikasi, silahkan verifikasi dengan OTP terlebih dahulu."
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    {
      if (!isPasswordValid) {
        throw new Error("Email atau password salah");
      }
    }
    const token = jwt.sign(
      {
        user: user.id,
        email: user.email,
        role: user.role,
      },
      SECRET_KEY,
      {
        expiresIn: "5h",
      }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async logout(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Simpan token ke blacklist
      await prisma.tokenBlacklist.create({
        data: {
          token,
          expiredAt: new Date(decoded.exp * 1000),
        },
      });

      return { success: true };
    } catch (err) {
      throw new Error("Logout gagal: " + err.message);
    }
  }
}

module.exports = AuthService;
