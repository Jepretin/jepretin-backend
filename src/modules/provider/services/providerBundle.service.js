const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderBundleService {
  static async createBundle({ userId, name, description, price }) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!provider) throw new AppError("Provider tidak ditemukan", 404);
    if (!provider.user.isActive)
      throw new AppError("Akun provider tidak aktif", 403);
    if (!provider.user.isVerified)
      throw new AppError("Akun provider belum diverifikasi", 403);
    if (provider.deletedAt)
      throw new AppError("Akun provider sudah dihapus", 403);
    if (["PENDING", "REJECTED"].includes(provider.status))
      throw new AppError("Status provider belum disetujui oleh admin", 403);

    const existing = await prisma.providerBundle.findFirst({
      where: { providerId: provider.id, name },
    });
    if (existing) throw new AppError("Nama bundle sudah digunakan", 400);

    const bundle = await prisma.providerBundle.create({
      data: {
        providerId: provider.id,
        name,
        description,
        price,
      },
    });

    return {
      id: bundle.id,
      providerId: provider.id,
      providerName: provider.user.name,
      name: bundle.name,
      description: bundle.description,
      price: bundle.price,
      createdAt: bundle.createdAt,
    };
  }

  static async getAllBundle() {
    const bundles = await prisma.providerBundle.findMany({
      where: { deletedAt: null },
      include: {
        provider: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: bundles.length,
      data: bundles.map((b) => ({
        id: b.id,
        providerId: b.provider.id,
        providerName: b.provider.user.name,
        name: b.name,
        description: b.description,
        price: b.price,
        createdAt: b.createdAt,
      })),
    };
  }

  static async getMyBundle(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!provider) throw new AppError("Provider tidak ditemukan.", 404);

    const myBundle = await prisma.providerBundle.findMany({
      where: { providerId: provider.id, deletedAt: null },
      include: {
        provider: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!myBundle.length)
      throw new AppError("Anda tidak memiliki paket bundle.", 404);

    return {
      total: myBundle.length,
      data: myBundle.map((b) => ({
        id: b.id,
        providerId: b.provider.id,
        providerName: b.provider.user.name,
        name: b.name,
        description: b.description,
        price: b.price,
        createdAt: b.createdAt,
      })),
    };
  }

  static async getBundleById(providerId) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { name: true, avatar: true } },
        bundles: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!provider) throw new AppError("Provider tidak ditemukan.", 404);
    if (!provider.bundles.length)
      throw new AppError("Provider tidak memiliki paket bundle.", 404);

    return {
      total: provider.bundles.length,
      data: provider.bundles.map((b) => ({
        id: b.id,
        providerId: provider.id,
        providerName: provider.user.name,
        name: b.name,
        description: b.description,
        price: b.price,
        createdAt: b.createdAt,
      })),
    };
  }

  static async updateBundle({ id, userId, name, description, price }) {
    const bundle = await prisma.providerBundle.findFirst({
      where: {
        id,
        provider: { userId },
        deletedAt: null,
      },
      include: {
        provider: {
          include: { user: { select: { name: true } } },
        },
      },
    });

    if (!bundle)
      throw new AppError(
        "Paket bundle tidak ditemukan atau bukan milik Anda.",
        404
      );

    if (name && name !== bundle.name) {
      const duplicate = await prisma.providerBundle.findFirst({
        where: {
          providerId: bundle.providerId,
          name,
          id: { not: id },
        },
      });
      if (duplicate) throw new AppError("Nama bundle sudah digunakan.", 400);
    }

    const updated = await prisma.providerBundle.update({
      where: { id },
      data: {
        name: name ?? bundle.name,
        description: description ?? bundle.description,
        price: price ?? bundle.price,
        updatedAt: new Date(),
      },
    });

    return {
      message: "Paket bundle berhasil diperbarui.",
      data: {
        id: updated.id,
        providerId: bundle.providerId,
        providerName: bundle.provider.user.name,
        name: updated.name,
        description: updated.description,
        price: updated.price,
        updatedAt: updated.updatedAt,
      },
    };
  }

  static async deleteBundle(id, userId) {
    const bundle = await prisma.providerBundle.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!bundle || bundle.provider.userId !== userId)
      throw new AppError(
        "Paket bundle tidak ditemukan atau bukan milik Anda.",
        404
      );

    await prisma.providerBundle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: "Paket bundle berhasil dihapus." };
  }
}

module.exports = ProviderBundleService;
