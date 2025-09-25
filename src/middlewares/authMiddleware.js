const jwt = require("jsonwebtoken");
const prisma = require("../services/prisma.service");
const AppError = require("../utils/appError");
const handleAsync = require("../utils/handleAsync");

class AuthMiddleware {
  static authenticate = handleAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new AppError("Token tidak ada", 401);

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    if (blacklisted) {
      throw new AppError("Token sudah tidak berlaku", 401);
    }

    req.user = decoded;
    next();
  });

  static authorize(...roles) {
    return handleAsync(async (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new AppError("Anda tidak memiliki akses ke resource ini", 403);
      }
      next();
    });
  }
}

module.exports = AuthMiddleware;
