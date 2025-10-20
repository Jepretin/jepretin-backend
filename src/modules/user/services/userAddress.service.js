const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const { formatAddressResponse } = require("../helpers/userAddress.helper");

class UserAddressService {
  static async addAddress({ userId, villageId, addressDetail, isPrimary }) {
    isPrimary = Boolean(isPrimary);

    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null, isVerified: true },
    });
    if (!user) throw new AppError("Akun belum terverifikasi", 403);

    const village = await prisma.village.findUnique({
      where: { id: villageId },
      include: {
        district: { include: { regency: { include: { province: true } } } },
      },
    });
    if (!village)
      throw new AppError("Village tidak tersedia atau tidak valid", 404);

    if (isPrimary) {
      await prisma.customerAddress.updateMany({
        where: { userId, deletedAt: null },
        data: { isPrimary: false },
      });
    }

    const address = await prisma.customerAddress.create({
      data: { userId, villageId, addressDetail, isPrimary },
      include: {
        village: {
          include: {
            district: { include: { regency: { include: { province: true } } } },
          },
        },
      },
    });

    return {
      data: formatAddressResponse(address, user.name),
    };
  }

  static async getAllAddress(userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null, isVerified: true },
    });
    if (!user) throw new AppError("Akun belum terverifikasi", 403);

    const addresses = await prisma.customerAddress.findMany({
      where: { userId, deletedAt: null },
      include: {
        village: {
          include: {
            district: { include: { regency: { include: { province: true } } } },
          },
        },
      },
    });

    if (addresses.length === 0)
      throw new AppError("Belum ada alamat yang tersimpan", 404);

    return {
      data: addresses.map((a) => formatAddressResponse(a, user.name)),
    };
  }

  static async getAddressById({ userId, addressId }) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null, isVerified: true },
    });
    if (!user) throw new AppError("Akun belum terverifikasi", 403);

    const address = await prisma.customerAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
      include: {
        village: {
          include: {
            district: { include: { regency: { include: { province: true } } } },
          },
        },
      },
    });

    if (!address) throw new AppError("Alamat tidak ditemukan", 404);

    return { data: formatAddressResponse(address, user.name) };
  }

  static async updateAddress({
    userId,
    addressId,
    villageId,
    addressDetail,
    isPrimary,
  }) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null, isVerified: true },
    });
    if (!user) throw new AppError("Akun belum terverifikasi", 403);

    const existing = await prisma.customerAddress.findFirst({
      where: { id: addressId, userId, deletedAt: null },
    });
    if (!existing) throw new AppError("Alamat tidak ditemukan", 404);

    if (isPrimary === true) {
      await prisma.customerAddress.updateMany({
        where: { userId, deletedAt: null },
        data: { isPrimary: false },
      });
    }

    if (villageId) {
      const validVillage = await prisma.village.findUnique({
        where: { id: villageId },
      });
      if (!validVillage) throw new AppError("Village ID tidak valid", 400);
    }

    const updated = await prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        villageId: villageId ?? existing.villageId,
        addressDetail: addressDetail ?? existing.addressDetail,
        isPrimary: isPrimary ?? existing.isPrimary,
      },
      include: {
        village: {
          include: {
            district: { include: { regency: { include: { province: true } } } },
          },
        },
      },
    });

    return {
      data: formatAddressResponse(updated, user.name),
    };
  }

  static async deleteAddress({ id, userId }) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null, isVerified: true },
    });
    if (!user) throw new AppError("Akun belum terverifikasi", 403);

    const address = await prisma.customerAddress.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!address)
      throw new AppError("Alamat tidak ditemukan atau sudah dihapus.", 404);

    await prisma.customerAddress.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = UserAddressService;
