const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { totp } = require("otplib"); // Import otplib
const { PrismaClient } = require("@prisma/client");
const prisma = require("../../../services/prisma.service");
const { error } = require("../../../utils/response");
const appError = require("../../../utils/appError");
const SECRET_KEY = process.env.JWT_SECRET;

class AuthService {
  static async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new appError("Email atau password salah", 401);
    }

    if (!user.isVerified) {
      throw new appError(
        "Akun belum terverifikasi, silahkan verifikasi dengan OTP terlebih dahulu.",
        403
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    {
      if (!isPasswordValid) {
        throw new appError("Email atau password salah", 401);
      }
    }
    const token = jwt.sign(
      {
        id: user.id,
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

      return {
        message: "Token telah di-blacklist. ",
      };
    } catch (err) {
      throw new appError("Token tidak valid atau sudah kadaluarsa.", 401);
    }
  }
}

module.exports = AuthService;
