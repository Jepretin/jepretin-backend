// src/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const prisma = require("../services/prisma.service");
const AppError = require("../utils/appError");

class AuthMiddleware {
  static async authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return next(new AppError("Token tidak ada", 401));

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // cek blacklist
      const blacklisted = await prisma.tokenBlacklist.findUnique({
        where: { token },
      });

      if (blacklisted) {
        return next(new AppError("Token sudah tidak berlaku", 401));
      }

      // simpan payload token di req.user
      req.user = decoded;
      next();
    } catch (err) {
      return next(new AppError("Token tidak valid", 401));
    }
  }

  static authorize(...roles) {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return next(
          new AppError("Anda tidak memiliki akses ke resource ini", 403)
        );
      }
      next();
    };
  }
}

module.exports = AuthMiddleware;
