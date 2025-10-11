const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class UserAddressService {
  static async addAddress({ userId, villageId, addressDetail, isPrimary }) {
    isPrimary = Boolean(isPrimary);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt || !user.isVerified) {
      throw new AppError("Akun belum terverifikasi", 403);
    }

    const village = await prisma.village.findUnique({
      where: { id: villageId },
      include: {
        district: {
          include: {
            regency: {
              include: {
                province: true,
              },
            },
          },
        },
      },
    });

    if (!village) {
      throw new AppError("Village tidak tersedia atau tidak valid", 404);
    }

    if (isPrimary) {
      await prisma.customerAddress.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        userId: user.id,
        villageId,
        addressDetail,
        isPrimary,
      },
      include: {
        village: {
          include: {
            district: {
              include: {
                regency: {
                  include: {
                    province: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      data: {
        id: address.id,
        name: user.name,
        addressDetail: address.addressDetail,
        isPrimary: address.isPrimary,
        createdAt: address.createdAt,
        village: {
          id: address.village.id,
          name: address.village.name,
          district: {
            id: address.village.district.id,
            name: address.village.district.name,
            regency: {
              id: address.village.district.regency.id,
              name: address.village.district.regency.name,
              province: {
                id: address.village.district.regency.province.id,
                name: address.village.district.regency.province.name,
              },
            },
          },
        },
      },
    };
  }

  static async getAddressById({ userId, addressId }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt || !user.isVerified) {
      throw new AppError("Akun belum terverifikasi", 403);
    }

    const address = await prisma.customerAddress.findUnique({
      where: { id: addressId },
      include: {
        village: {
          include: {
            district: {
              include: {
                regency: {
                  include: {
                    province: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!address) {
      throw new AppError("Alamat tidak ditemukan", 404);
    }

    // Pastikan user hanya bisa ambil alamat miliknya sendiri
    if (address.userId !== userId) {
      throw new AppError("Anda tidak memiliki akses ke alamat ini", 403);
    }

    return {
      data: {
        id: address.id,
        userName: user.name,
        addressDetail: address.addressDetail,
        isPrimary: address.isPrimary,
        createdAt: address.createdAt,
        village: {
          id: address.village.id,
          name: address.village.name,
          district: {
            id: address.village.district.id,
            name: address.village.district.name,
            regency: {
              id: address.village.district.regency.id,
              name: address.village.district.regency.name,
              province: {
                id: address.village.district.regency.province.id,
                name: address.village.district.regency.province.name,
              },
            },
          },
        },
      },
    };
  }
}

module.exports = UserAddressService;
