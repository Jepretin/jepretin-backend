const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderAvailabilityService {
  static async addAvailability({ userId, startDate, endDate, isAvailable }) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    if (provider.status !== "ACCEPTED") {
      throw new AppError(
        "Hanya provider yang sudah diterima yang dapat mengatur ketersediaan",
        403
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      throw new AppError(
        "Tanggal selesai harus setelah tanggal mulai",
        400
      );
    }

    const availability = await prisma.providerAvailability.create({
      data: {
        providerId: provider.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isAvailable: isAvailable ?? true,
      },
    });

    return {
      message: "Ketersediaan berhasil ditambahkan",
      data: {
        id: availability.id,
        providerId: availability.providerId,
        startDate: availability.startDate,
        endDate: availability.endDate,
        isAvailable: availability.isAvailable,
        createdAt: availability.createdAt,
      },
    };
  }

  static async getMyAvailabilities(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    const availabilities = await prisma.providerAvailability.findMany({
      where: { providerId: provider.id, deletedAt: null },
      orderBy: { startDate: "asc" },
    });

    if (!availabilities.length) {
      throw new AppError("Belum ada data ketersediaan", 404);
    }

    return {
      total: availabilities.length,
      data: availabilities.map((a) => ({
        id: a.id,
        startDate: a.startDate,
        endDate: a.endDate,
        isAvailable: a.isAvailable,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      })),
    };
  }

  static async getAvailabilityById(userId, availabilityId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    const availability = await prisma.providerAvailability.findFirst({
      where: { id: availabilityId, deletedAt: null },
    });

    if (!availability) {
      throw new AppError("Data ketersediaan tidak ditemukan", 404);
    }

    if (availability.providerId !== provider.id) {
      throw new AppError(
        "Anda tidak memiliki akses ke data ini",
        403
      );
    }

    return {
      data: {
        id: availability.id,
        providerId: availability.providerId,
        startDate: availability.startDate,
        endDate: availability.endDate,
        isAvailable: availability.isAvailable,
        createdAt: availability.createdAt,
        updatedAt: availability.updatedAt,
      },
    };
  }

  static async updateAvailability({
    userId,
    availabilityId,
    startDate,
    endDate,
    isAvailable,
  }) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    const availability = await prisma.providerAvailability.findFirst({
      where: { id: availabilityId, deletedAt: null },
    });

    if (!availability) {
      throw new AppError("Data ketersediaan tidak ditemukan", 404);
    }

    if (availability.providerId !== provider.id) {
      throw new AppError(
        "Anda tidak memiliki akses ke data ini",
        403
      );
    }

    const newStartDate = startDate ? new Date(startDate) : availability.startDate;
    const newEndDate = endDate ? new Date(endDate) : availability.endDate;

    if (startDate && endDate && newStartDate >= newEndDate) {
      throw new AppError(
        "Tanggal selesai harus setelah tanggal mulai",
        400
      );
    }

    if (startDate && !endDate && newStartDate >= availability.endDate) {
      throw new AppError(
        "Tanggal mulai harus sebelum tanggal selesai yang sudah ada",
        400
      );
    }

    if (!startDate && endDate && availability.startDate >= newEndDate) {
      throw new AppError(
        "Tanggal selesai harus setelah tanggal mulai yang sudah ada",
        400
      );
    }

    const updated = await prisma.providerAvailability.update({
      where: { id: availabilityId },
      data: {
        startDate: startDate ? newStartDate : undefined,
        endDate: endDate ? newEndDate : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
      },
    });

    return {
      message: "Ketersediaan berhasil diperbarui",
      data: {
        id: updated.id,
        providerId: updated.providerId,
        startDate: updated.startDate,
        endDate: updated.endDate,
        isAvailable: updated.isAvailable,
        updatedAt: updated.updatedAt,
      },
    };
  }

  static async deleteAvailability(userId, availabilityId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    const availability = await prisma.providerAvailability.findFirst({
      where: { id: availabilityId, deletedAt: null },
    });

    if (!availability) {
      throw new AppError("Data ketersediaan tidak ditemukan", 404);
    }

    if (availability.providerId !== provider.id) {
      throw new AppError(
        "Anda tidak memiliki akses ke data ini",
        403
      );
    }

    await prisma.providerAvailability.update({
      where: { id: availabilityId },
      data: { deletedAt: new Date() },
    });

    return { message: "Ketersediaan berhasil dihapus" };
  }
}

module.exports = ProviderAvailabilityService;
