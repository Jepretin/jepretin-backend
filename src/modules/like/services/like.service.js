const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class LikeService {
  static async toggleLike(userId, portfolioId) {
    const portfolio = await prisma.providerPortfolio.findFirst({
      where: { id: portfolioId, deletedAt: null },
    });

    if (!portfolio) {
      throw new AppError("Portofolio tidak ditemukan", 404);
    }

    const existing = await prisma.like.findFirst({
      where: { userId, portfolioId },
    });

    if (existing) {
      await prisma.like.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });

      const count = await prisma.like.count({
        where: { portfolioId, deletedAt: null },
      });

      return {
        liked: false,
        likeCount: count,
        message: "Like dihapus",
      };
    }

    await prisma.like.create({
      data: { userId, portfolioId },
    });

    const count = await prisma.like.count({
      where: { portfolioId, deletedAt: null },
    });

    return {
      liked: true,
      likeCount: count,
      message: "Portofolio disukai",
    };
  }

  static async getLikeCount(portfolioId) {
    const portfolio = await prisma.providerPortfolio.findFirst({
      where: { id: portfolioId, deletedAt: null },
    });

    if (!portfolio) {
      throw new AppError("Portofolio tidak ditemukan", 404);
    }

    const count = await prisma.like.count({
      where: { portfolioId, deletedAt: null },
    });

    return { portfolioId, likeCount: count };
  }

  static async getMyLikes(userId) {
    const likes = await prisma.like.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        portfolio: {
          include: {
            provider: {
              include: {
                user: { select: { name: true, avatar: true } },
              },
            },
          },
        },
      },
    });

    if (!likes.length) {
      return { total: 0, data: [] };
    }

    return {
      total: likes.length,
      data: likes.map((l) => ({
        id: l.id,
        likedAt: l.createdAt,
        portfolio: {
          id: l.portfolio.id,
          mediaUrl: l.portfolio.mediaUrl,
          mediaType: l.portfolio.mediaType,
          description: l.portfolio.description,
          providerName: l.portfolio.provider.user.name,
          providerAvatar: l.portfolio.provider.user.avatar,
        },
      })),
    };
  }
}

module.exports = LikeService;
