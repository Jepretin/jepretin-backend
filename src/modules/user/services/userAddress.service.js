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

  static async getAllAddress(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt || !user.isVerified) {
      throw new AppError("Akun belum terverifikasi", 403);
    }

    const addresses = await prisma.customerAddress.findMany({
      where: { userId },
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

    if (!addresses.length) {
      throw new AppError("Belum ada alamat yang tersimpan", 404);
    }

    return {
      message: "Daftar alamat berhasil diambil",
      data: addresses.map((address) => ({
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
      })),
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

  static async updateAddress({
    userId,
    addressId,
    villageId,
    addressDetail,
    isPrimary,
  }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.deletedAt || !user.isVerified) {
      throw new AppError("Akun belum terverifikasi", 403);
    }

    const existing = await prisma.customerAddress.findUnique({
      where: { id: addressId },
      include: {
        village: {
          include: {
            district: {
              include: {
                regency: {
                  include: { province: true },
                },
              },
            },
          },
        },
      },
    });

    if (!existing || existing.deletedAt) {
      throw new AppError("Alamat tidak ditemukan", 404);
    }

    if (existing.userId !== user.id) {
      throw new AppError("Anda tidak berhak memperbarui alamat ini", 403);
    }

    if (isPrimary === true) {
      await prisma.customerAddress.updateMany({
        where: { userId },
        data: { isPrimary: false },
      });
    }

    const village = await prisma.village.findUnique({
      where: { id: villageId },
    });

    if (!village) {
      throw new AppError("Village ID tidak valid atau tidak ditemukan.", 400);
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
            district: {
              include: {
                regency: {
                  include: { province: true },
                },
              },
            },
          },
        },
      },
    });

    return {
      data: {
        id: updated.id,
        userName: user.name,
        addressDetail: updated.addressDetail,
        isPrimary: updated.isPrimary,
        updatedAt: updated.updatedAt,
        village: {
          id: updated.village.id,
          name: updated.village.name,
          district: {
            id: updated.village.district.id,
            name: updated.village.district.name,
            regency: {
              id: updated.village.district.regency.id,
              name: updated.village.district.regency.name,
              province: {
                id: updated.village.district.regency.province.id,
                name: updated.village.district.regency.province.name,
              },
            },
          },
        },
      },
    };
  }

  static async deleteAddress({ id, userId }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive || user.deletedAt || !user.isVerified) {
      throw new AppError("Akun belum terverifikasi atau tidak aktif.", 403);
    }

    const address = await prisma.customerAddress.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!address) {
      throw new AppError("Alamat tidak ditemukan atau bukan milik Anda.", 404);
    }

    await prisma.customerAddress.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: "Alamat berhasil dihapus." };
  }
}

module.exports = UserAddressService;
