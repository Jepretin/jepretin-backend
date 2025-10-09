const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderToppingService {
  static async createTopping({
    userId,
    bundleId,
    name,
    description,
    isStandalone,
    price,
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

    const existing = await prisma.providerTopping.findFirst({
      where: {
        providerId: provider.id,
        name,
        deletedAt: null,
      },
    });
    if (existing) throw new AppError("Nama topping sudah digunakan.", 400);

    // Hanya validasi bundle jika bukan standalone
    if (!isStandalone) {
      if (!bundleId)
        throw new AppError("Topping ini harus terhubung dengan bundle.", 400);

      const bundle = await prisma.providerBundle.findUnique({
        where: { id: bundleId },
      });

      if (!bundle || bundle.deletedAt)
        throw new AppError("Bundle yang dipilih tidak ditemukan.", 404);

      if (bundle.providerId !== provider.id)
        throw new AppError("Bundle tidak dimiliki oleh provider ini.", 403);
    }

    const topping = await prisma.providerTopping.create({
      data: {
        providerId: provider.id,
        name,
        description,
        price,
        isStandalone: Boolean(isStandalone),
      },
    });

    return {
      message: "Provider topping berhasil ditambahkan",
      data: {
        id: topping.id,
        providerId: provider.id,
        providerName: provider.user.name,
        name: topping.name,
        description: topping.description,
        price: topping.price,
        isStandalone: topping.isStandalone,
        createdAt: topping.createdAt,
      },
    };
  }

  static async getAllTopping() {
    const toppings = await prisma.providerTopping.findMany({
      where: { deletedAt: null },
      include: {
        provider: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      total: toppings.length,
      data: toppings.map((t) => ({
        id: t.id,
        providerId: t.provider.id,
        providerName: t.provider.user.name,
        name: t.name,
        description: t.description,
        price: t.price,
        isStandalone: t.isStandalone,
        createdAt: t.createdAt,
      })),
    };
  }

  static async getMyTopping(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!provider) throw new AppError("Provider tidak ditemukan.", 404);

    const myTopping = await prisma.providerTopping.findMany({
      where: { providerId: provider.id, deletedAt: null },
      include: {
        provider: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!myTopping.length)
      throw new AppError("Anda tidak memiliki topping.", 404);

    return {
      total: myTopping.length,
      data: myTopping.map((t) => ({
        id: t.id,
        providerId: t.provider.id,
        providerName: t.provider.user.name,
        name: t.name,
        description: t.description,
        price: t.price,
        isStandalone: t.isStandalone,
        createdAt: t.createdAt,
      })),
    };
  }

  static async getToppingByProviderId(providerId) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { name: true, avatar: true } },
        toppings: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!provider) throw new AppError("Provider tidak ditemukan.", 404);
    if (!provider.toppings.length)
      throw new AppError("Provider tidak memiliki topping.", 404);

    return {
      total: provider.toppings.length,
      data: provider.toppings.map((t) => ({
        id: t.id,
        providerId: provider.id,
        providerName: provider.user.name,
        name: t.name,
        description: t.description,
        price: t.price,
        isStandalone: t.isStandalone,
        createdAt: t.createdAt,
      })),
    };
  }

  static async updateTopping({
    id,
    userId,
    bundleId,
    name,
    description,
    isStandalone,
    price,
  }) {
    const topping = await prisma.providerTopping.findFirst({
      where: { id, provider: { userId }, deletedAt: null },
      include: {
        provider: { include: { user: { select: { name: true } } } },
      },
    });

    if (!topping)
      throw new AppError("Topping tidak ditemukan atau bukan milik Anda.", 404);

    if (!isStandalone) {
      if (!bundleId)
        throw new AppError("Topping ini harus terhubung dengan bundle.", 400);

      const bundle = await prisma.providerBundle.findUnique({
        where: { id: bundleId },
      });

      if (!bundle || bundle.deletedAt)
        throw new AppError("Bundle yang dipilih tidak ditemukan.", 404);

      if (bundle.providerId !== topping.provider.id)
        throw new AppError("Bundle tidak dimiliki oleh provider ini.", 403);
    }

    const updated = await prisma.providerTopping.update({
      where: { id },
      data: {
        name: name ?? topping.name,
        description: description ?? topping.description,
        price: price ?? topping.price,
        isStandalone:
          typeof isStandalone === "boolean"
            ? isStandalone
            : topping.isStandalone,
      },
    });

    return {
      message: "Topping berhasil diperbarui.",
      data: {
        id: updated.id,
        providerId: topping.provider.id,
        providerName: topping.provider.user.name,
        name: updated.name,
        description: updated.description,
        isStandalone: updated.isStandalone,
        price: updated.price,
        updatedAt: updated.updatedAt,
      },
    };
  }

  static async deleteTopping(id, userId) {
    const topping = await prisma.providerTopping.findFirst({
      where: { id, provider: { userId }, deletedAt: null },
    });

    if (!topping)
      throw new AppError("Topping tidak ditemukan atau bukan milik Anda.", 404);

    await prisma.providerTopping.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: "Topping berhasil dihapus." };
  }
}

module.exports = ProviderToppingService;
