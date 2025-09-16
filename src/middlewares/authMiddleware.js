import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token tidak ada" });

  const token = authHeader.split(" ")[1];

  try {
    // verifikasi JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // cek blacklist
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    if (blacklisted) {
      return res.status(401).json({ message: "Token sudah tidak berlaku" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Token tidak valid", error: err.message });
  }
};
