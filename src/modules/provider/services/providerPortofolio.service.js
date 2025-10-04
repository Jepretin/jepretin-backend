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
    return portofolios;
  }
}

module.exports = ProviderPortofolioService;
