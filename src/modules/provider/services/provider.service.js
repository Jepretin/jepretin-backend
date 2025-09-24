const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderService {
  static async registerProvider({
    userId,
    experience,
    bankName,
    bankAccountNumber,
    bankAccountName,
  }) {
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
        bankName,
        bankAccountNumber,
        bankAccountName,
      },
    });

    return provider;
  }

  static async getAllProvider() {
    const providers = prisma.provider.findMany();
    if (!providers) {
      throw new AppError("Tidak ada data Provider", 404);
    }
  }

  static async getProviderById(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });
    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }
    return provider;
  }

  static async updateProvider(userId, data) {
    try {
      const updateData = {};
      const fields = [
        "status",
        "experience",
        "bankName",
        "bankAccountNumber",
        "bankAccountName",
      ];

      fields.forEach((field) => {
        if (data[field] !== undefined) {
          updateData[field] = data[field];
        }
      });

      if (Object.keys(updateData).length === 0) {
        throw new AppError("Tidak ada data yang dikirim untuk diperbarui", 400);
      }

      const updatedProvider = await prisma.provider.update({
        where: { userId },
        data: updateData,
      });

      await prisma.notification.create({
        data: {
          userId: updatedProvider.userId,
          type: "SYSTEM",
          message: "Perubahan profil Provider berhasil!",
          isRead: false,
        },
      });

      return updatedProvider;
    } catch (error) {
      throw new AppError("Gagal memperbarui Provider", 500);
    }
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
