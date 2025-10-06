const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderPortofolioService {
  static async addPortofolio({
    userId,
    mediaUrl,
    mediaId,
    mediaType,
    description,
  }) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (
      !provider ||
      !provider.user.isActive ||
      provider.deletedAt ||
      !provider.user.isVerified ||
      ["PENDING", "REJECTED"].includes(provider.status)
    ) {
      throw new AppError("Anda tidak memiliki akses ke resource ini", 403);
    }

    const portofolio = await prisma.providerPortfolio.create({
      data: {
        providerId: provider.id, // ini baru pakai provider.id
        mediaUrl,
        mediaId,
        mediaType,
        description,
      },
    });

    return portofolio;
  }

  static async getAllPortofolio() {
    const portofolios = await prisma.providerPortfolio.findMany({
      where: { deletedAt: null },
    });
    if (!portofolios) {
      throw new AppError("Tidak ada portofolio", 404);
    }
    return portofolios.map((p) => ({
      id: p.id,
      providerId: p.providerId,
      mediaUrl: p.mediaUrl,
      mediaId: p.mediaId,
      mediaType: p.mediaType,
      description: p.description,
    }));
  }

  static async getMyPortofolio(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("provider tidak ditemukan.", 404);
    }

    const portofolio = await prisma.providerPortfolio.findMany({
      where: {
        providerId: provider.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!portofolio || portofolio.length === 0) {
      throw new AppError("Portofolio tidak ditemukan.", 404);
    }

    return portofolio.map((p) => ({
      id: p.id,
      providerId: p.providerId,
      mediaUrl: p.mediaUrl,
      mediaId: p.mediaId,
      mediaType: p.mediaType,
      description: p.description,
    }));
  }

  static async getPortofolioById(providerId) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        portfolios: true,
      },
    });

    if (!provider) {
      throw new AppError("provider tidak ditemukan.", 404);
    }

    const portfolios = provider.portfolios.filter((p) => !p.deletedAt);

    return portfolios.map((p) => ({
      id: p.id,
      mediaUrl: p.mediaUrl,
      mediaId: p.mediaId,
      mediaType: p.mediaType,
      description: p.description,
    }));
  }

  static async deletePortofolio(id, userId) {
    const portofolio = await prisma.providerPortfolio.findFirst({
      where: {
        id,
        provider: {
          userId: userId,
        },
      },
    });

    if (!portofolio) {
      throw new AppError(
        "Portofolio tidak ditemukan atau bukan milik Anda.",
        404
      );
    }

    await prisma.providerPortfolio.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = ProviderPortofolioService;
