const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const SECRET_KEY = process.env.JWT_SECRET;

class AuthService {
  static async login({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError("Email atau password salah", 401);
    }

    if (!user.isVerified) {
      throw new AppError(
        "Akun belum terverifikasi, silahkan verifikasi dengan OTP terlebih dahulu.",
        403
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError("Email atau password salah", 401);
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
    } catch (error) {
      throw new AppError("Token tidak valid atau sudah kadaluarsa.", 401);
    }
  }
}

module.exports = AuthService;
