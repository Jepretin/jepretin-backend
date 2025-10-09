const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderPortofolioService {
  //  Untuk menambah portofolio baru
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

    if (!req.files || req.files.length === 0) {
      throw new AppError("Tidak ada file yang diupload", 400);
    }

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
        providerId: provider.id,
        mediaUrl,
        mediaId,
        mediaType,
        description,
      },
    });

    return {
      message: "Portofolio berhasil ditambahkan",
      data: {
        id: portofolio.id,
        providerId: provider.id,
        providerName: provider.user.name,
        mediaUrl,
        mediaType,
        description,
        createdAt: portofolio.createdAt,
      },
    };
  }

  // Untuk mendapatkan semua portofolio (admin only)
  static async getAllPortofolio() {
    const portofolios = await prisma.providerPortfolio.findMany({
      where: { deletedAt: null },
      include: {
        provider: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!portofolios.length) throw new AppError("Tidak ada portofolio", 404);

    return {
      total: portofolios.length,
      data: portofolios.map((p) => ({
        id: p.id,
        providerId: p.provider.id,
        providerName: p.provider.user.name,
        providerAvatar: p.provider.user.avatar,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        description: p.description,
        createdAt: p.createdAt,
      })),
    };
  }

  // Untuk mendapatkan portofolio milik provider yang login
  static async getMyPortofolio(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!provider) throw new AppError("Provider tidak ditemukan.", 404);

    const portofolios = await prisma.providerPortfolio.findMany({
      where: { providerId: provider.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!portofolios.length)
      throw new AppError("Anda belum mempunyai portofolio", 404);

    return {
      total: portofolios.length,
      data: portofolios.map((p) => ({
        id: p.id,
        providerId: provider.id,
        providerName: provider.user.name,
        providerAvatar: provider.user.avatar,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        description: p.description,
        createdAt: p.createdAt,
      })),
    };
  }

  // Untuk mendapatkan portofolio berdasarkan provider yang dipilih customer
  static async getPortofolioById(providerId) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { name: true, avatar: true } },
        portfolios: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!provider) throw new AppError("Provider tidak ditemukan.", 404);

    const portofolios = await prisma.providerPortfolio.findMany({
      where: { providerId: provider.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!portofolios.length)
      throw new AppError("Provider tidak memiliki portofolio.", 404);

    return {
      providerId: provider.id,
      providerName: provider.user.name,
      providerAvatar: provider.user.avatar,
      totalPortfolios: provider.portfolios.length,
      portfolios: provider.portfolios.map((p) => ({
        id: p.id,
        mediaUrl: p.mediaUrl,
        mediaType: p.mediaType,
        description: p.description,
        createdAt: p.createdAt,
      })),
    };
  }

  // Untuk Ambil portofolio provider berdasarkan lokasi customer
  static async getPortofolioByCustomerLocation(userId) {
    const address = await prisma.customerAddress.findFirst({
      where: { userId, isPrimary: true, deletedAt: null },
    });

    if (!address)
      throw new AppError("Alamat utama pelanggan tidak ditemukan.", 404);

    const providers = await prisma.provider.findMany({
      where: {
        coverages: { some: { districtId: address.districtId } },
        deletedAt: null,
      },
      include: {
        user: { select: { name: true, avatar: true } },
        portfolios: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!providers.length)
      throw new AppError(
        "Tidak ditemukan portofolio provider di lokasi Anda.",
        404
      );

    const portofolios = await prisma.providerPortfolio.findMany({
      where: { providerId: provider.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!portofolios.length)
      throw new AppError("Portofolio tidak ditemukan.", 404);

    return {
      totalProviders: providers.length,
      providers: providers.map((p) => ({
        providerId: p.id,
        providerName: p.user.name,
        providerAvatar: p.user.avatar,
        totalPortfolios: p.portfolios.length,
        portfolios: p.portfolios.map((port) => ({
          id: port.id,
          mediaUrl: port.mediaUrl,
          mediaType: port.mediaType,
          description: port.description,
          createdAt: port.createdAt,
        })),
      })),
    };
  }

  // Untuk Hapus portofolio provider (Soft Delete)
  static async deletePortofolio(id, userId) {
    const portofolio = await prisma.providerPortfolio.findFirst({
      where: { id, provider: { userId } },
    });

    if (!portofolio)
      throw new AppError(
        "Portofolio tidak ditemukan atau bukan milik Anda.",
        404
      );

    await prisma.providerPortfolio.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: "Portofolio berhasil dihapus." };
  }
}

module.exports = ProviderPortofolioService;
