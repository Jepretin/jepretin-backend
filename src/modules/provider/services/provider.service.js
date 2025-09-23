const { PrismaClient } = require("@prisma/client");
const prisma = require("../../../services/prisma.service");
const bcrypt = require("bcrypt");
const appError = require("../../../utils/appError");

class ProviderService {
  static async registerProvider({
    userId,
    status,
    experience,
    bankName,
    bankAccountNumber,
    bankAccountName,
  }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt || !user.isVerified) {
      throw new appError("Akun belum terverifikasi", 403);
    }
    const newProvider = await prisma.provider.create({
      data: {
        userId,
        status: "PENDING",
        experience,
        bankName,
        bankAccountNumber,
        bankAccountName,
      },
    });
    return { newProvider };
  }

  static async getAllProvider() {
    return prisma.provider.findMany();
  }

  static async getProviderById(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });
    if (!provider) {
      throw new appError("Provider tidak ditemukan", 404);
    }
    return provider;
  }

  static async updateProvider(userId, data) {
    const updateData = {
      status: data.status,
      experience: data.experience,
      bankName: data.bankName,
      bankAccountNumber: data.bankAccountNumber,
      bankAccountName: data.bankAccountName,
    };

    const updatedProvider = await prisma.provider.update({
      where: { userId },
      data: updateData,
    });

    await prisma.notification.create({
      data: {
        userId: updatedProvider.userId,
        type: "SYSTEM",
        message: `Perubahan profil Provider berhasil!`,
        isRead: false,
      },
    });

    return updatedProvider;
  }

  static async deleteProvider(providerId) {
    return prisma.provider.update({
      where: { id: providerId },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

module.exports = ProviderService;
