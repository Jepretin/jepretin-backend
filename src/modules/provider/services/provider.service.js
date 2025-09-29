const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderService {
  static async registerProvider({ userId, experience, roleIds }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt || !user.isVerified) {
      throw new AppError("Akun belum terverifikasi", 403);
    }

    const existingProvider = await prisma.provider.findFirst({
      where: {
        userId,
        status: "PENDING",
        deletedAt: null,
      },
    });

    if (existingProvider) {
      throw new AppError("Kamu sudah mendaftar, tunggu proses verifikasi", 400);
    }

    const provider = await prisma.provider.create({
      data: {
        userId,
        status: "PENDING",
        experience,
      },
    });

    if (roleIds && roleIds.length > 0) {
      const roleData = roleIds.map((roleId) => ({
        providerId: provider.id,
        roleId,
      }));
      await prisma.providerRole.createMany({ data: roleData });
    }

    const providerWithRelations = await prisma.provider.findUnique({
      where: { id: provider.id },
      include: {
        roles: { include: { role: true } },
        user: true,
      },
    });

    return {
      id: providerWithRelations.id,
      status: providerWithRelations.status,
      experience: providerWithRelations.experience,
      name: providerWithRelations.user.name,
      email: providerWithRelations.user.email,
      phone: providerWithRelations.user.phone,
      avatar: providerWithRelations.user.avatar,
      roles: providerWithRelations.roles.map((r) => ({
        id: r.role.id,
        name: r.role.name,
      })),
    };
  }

  static async getAllProvider() {
    const providers = await prisma.provider.findMany({
      where: { deletedAt: null },
      include: {
        roles: { include: { role: true } },
        user: true,
      },
    });

    if (!providers || providers.length === 0) {
      throw new AppError("Tidak ada data Provider", 404);
    }

    return providers.map((p) => ({
      id: p.id,
      status: p.status,
      experience: p.experience,
      name: p.user?.name,
      email: p.user?.email,
      phone: p.user?.phone,
      avatar: p.user?.avatar,
      roles: p.roles.map((r) => ({
        id: r.role.id,
        name: r.role.name,
      })),
    }));
  }

  static async getProviderById(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: {
        roles: { include: { role: true } },
        user: true,
      },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    return {
      id: provider.id,
      status: provider.status,
      experience: provider.experience,
      name: provider.user.name,
      email: provider.user.email,
      phone: provider.user.phone,
      avatar: provider.user.avatar,
      roles: provider.roles.map((r) => ({
        id: r.role.id,
        name: r.role.name,
      })),
    };
  }

  static async updateExperience(userId, experience) {
    const provider = await prisma.provider.findUnique({ where: { userId } });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    if (provider.status !== "REJECTED") {
      throw new AppError(
        "Experience hanya bisa diperbarui jika status REJECTED",
        400
      );
    }

    const updatedProvider = await prisma.provider.update({
      where: { userId },
      data: { experience },
    });

    await prisma.notification.create({
      data: {
        userId: updatedProvider.userId,
        type: "SYSTEM",
        message: "Experience berhasil diperbarui!",
        isRead: false,
      },
    });

    return updatedProvider;
  }

  static async updateStatus(providerId, status, userRole) {
    if (userRole !== "ADMIN") {
      throw new AppError(
        "Hanya admin yang dapat memperbarui status provider",
        403
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: { status },
    });

    await prisma.notification.create({
      data: {
        userId: updatedProvider.userId,
        type: "SYSTEM",
        message: `Status pendaftaran Anda diperbarui menjadi ${status}`,
        isRead: false,
      },
    });

    return updatedProvider;
  }

  static async deleteProvider(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }
    return prisma.provider.update({
      where: { userId },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

module.exports = ProviderService;
