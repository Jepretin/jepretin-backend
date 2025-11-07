const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const WalletService = require("../../wallet/services/wallet.service");

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

    const acceptedProvider = await prisma.provider.findFirst({
      where: {
        userId,
        status: "ACCEPTED",
        deletedAt: null,
      },
    });

    if (acceptedProvider) {
      throw new AppError("Kamu sudah terdaftar sebagai Provider", 400);
    }

    return await prisma.$transaction(async (tx) => {
      if (roleIds && roleIds.length > 0) {
        const validRoles = await tx.role.findMany({
          where: {
            id: { in: roleIds },
            deletedAt: null,
          },
          select: { id: true },
        });

        const validRoleIds = validRoles.map((r) => r.id);

        const invalidRoles = roleIds.filter((id) => !validRoleIds.includes(id));
        if (invalidRoles.length > 0) {
          throw new AppError(
            `Role dengan ID berikut tidak ditemukan: ${invalidRoles.join(
              ", "
            )}`,
            404
          );
        }
      }

      const provider = await tx.provider.create({
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
        await tx.providerRole.createMany({ data: roleData });
      }

      const providerWithRelations = await tx.provider.findUnique({
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
    });
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
    const provider = await prisma.provider.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    if (provider.status !== "REJECTED") {
      throw new AppError(
        "Experience hanya bisa diperbarui jika status REJECTED",
        400
      );
    }

    const [updatedProvider] = await prisma.$transaction([
      prisma.provider.update({
        where: { userId },
        data: {
          experience,
          status: "PENDING",
        },
        include: { user: true },
      }),
      prisma.notification.create({
        data: {
          userId,
          type: "SYSTEM",
          message:
            "Experience berhasil diperbarui! Status Anda kembali menjadi PENDING untuk diverifikasi ulang.",
          isRead: false,
        },
      }),
    ]);

    return {
      code: 200,
      message: "Experience berhasil diperbarui dan menunggu verifikasi admin.",
      data: {
        providerId: updatedProvider.id,
        name: updatedProvider.user.name,
        email: updatedProvider.user.email,
        newStatus: updatedProvider.status,
        experience: updatedProvider.experience,
      },
    };
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
      include: { user: true, roles: { include: { role: true } } },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedProvider = await tx.provider.update({
        where: { id: providerId },
        data: { status },
        include: { user: true, roles: { include: { role: true } } },
      });

      let newUserRole = provider.user.role;
      let walletData = null;

      if (status === "ACCEPTED") {
        await tx.user.update({
          where: { id: provider.userId },
          data: { role: "PROVIDER" },
        });
        newUserRole = "PROVIDER";

        const existingWallet = await tx.wallet.findFirst({
          where: { providerId: provider.id, deletedAt: null },
        });

        if (!existingWallet) {
          const wallet = await tx.wallet.create({
            data: {
              providerId: provider.id,
              currentBalance: 0,
              pendingBalance: 0,
            },
          });

          walletData = wallet;

          await tx.notification.create({
            data: {
              userId: provider.userId,
              type: "SYSTEM",
              message: "Akun Anda telah disetujui dan wallet otomatis dibuat.",
              isRead: false,
            },
          });
        }
      }

      const notif = await tx.notification.create({
        data: {
          userId: provider.userId,
          type: "SYSTEM",
          message: `Status pendaftaran Anda diperbarui menjadi ${status}`,
          isRead: false,
        },
      });

      return { updatedProvider, notif, newUserRole, walletData };
    });

    const { updatedProvider, newUserRole, walletData } = result;

    return {
      code: 200,
      message: "Status provider berhasil diperbarui.",
      data: {
        providerId: updatedProvider.id,
        name: updatedProvider.user.name,
        email: updatedProvider.user.email,
        phone: updatedProvider.user.phone,
        experience: updatedProvider.experience,
        newStatus: updatedProvider.status,
        newRole: newUserRole,
        wallet: walletData
          ? {
              id: walletData.id,
              currentBalance: walletData.currentBalance,
              pendingBalance: walletData.pendingBalance,
              currency: walletData.currency,
            }
          : "Wallet sudah ada",
        rolesTaken: updatedProvider.roles.map((r) => ({
          id: r.role.id,
          name: r.role.name,
        })),
      },
    };
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
