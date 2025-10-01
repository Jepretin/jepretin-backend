const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderCoverageService {
  static async addCoverage({ userId, districtId }) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    if (provider.status !== "ACCEPTED") {
      throw new AppError(
        "Provider belum diterima, tidak bisa menambah coverage",
        403
      );
    }

    const district = await prisma.district.findUnique({
      where: { id: districtId },
    });

    if (!district) {
      throw new AppError("District tidak tersedia atau tidak valid", 404);
    }

    const exist = await prisma.providerCoverage.findUnique({
      where: { providerId_districtId: { providerId: provider.id, districtId } },
    });

    if (exist) {
      throw new AppError("Coverage sudah ada", 400);
    }

    const coverage = await prisma.providerCoverage.create({
      data: { providerId: provider.id, districtId },
      include: {
        district: {
          include: {
            regency: { include: { province: true } },
          },
        },
      },
    });

    // Formatter biar lebih clean
    return {
      id: coverage.id,
      district: {
        id: coverage.district.id,
        name: coverage.district.name,
        regency: {
          id: coverage.district.regency.id,
          name: coverage.district.regency.name,
          province: {
            id: coverage.district.regency.province.id,
            name: coverage.district.regency.province.name,
          },
        },
      },
    };
  }

  static async getProviderCoverage(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    if (provider.status !== "ACCEPTED") {
      throw new AppError(
        "Provider belum diterima, tidak bisa menambah coverage",
        403
      );
    }

    const coverages = await prisma.providerCoverage.findMany({
      where: { providerId: provider.id, deletedAt: null },
      include: {
        district: {
          include: {
            regency: { include: { province: true } },
          },
        },
      },
    });

    // Formatter biar clean
    return coverages.map((c) => ({
      id: c.id,
      district: {
        id: c.district.id,
        name: c.district.name,
        regency: {
          id: c.district.regency.id,
          name: c.district.regency.name,
          province: {
            id: c.district.regency.province.id,
            name: c.district.regency.province.name,
          },
        },
      },
    }));
  }

  static async findProvidersByDistrict(districtId) {
    const coverages = await prisma.providerCoverage.findMany({
      where: { districtId },
      include: {
        provider: {
          select: {
            user: { select: { name: true } }, // ambil nama user
            roles: {
              // ambil list role dari ProviderRole
              select: {
                role: { select: { name: true } },
              },
            },
          },
        },
        district: {
          select: {
            id: true,
            name: true,
            regency: {
              select: {
                id: true,
                name: true,
                province: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (coverages.length === 0) {
      throw new AppError("Tidak ada provider yang mencover district ini", 404);
    }

    // formatter hasil
    return coverages.map((c) => ({
      providerName: c.provider.user.name,
      providerRoles: c.provider.roles.map((r) => r.role.name),
      district: {
        id: c.district.id,
        name: c.district.name,
        regency: {
          id: c.district.regency.id,
          name: c.district.regency.name,
          province: {
            id: c.district.regency.province.id,
            name: c.district.regency.province.name,
          },
        },
      },
    }));
  }

  static async removeCoverage(userId, districtId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }
    const exist = await prisma.providerCoverage.findUnique({
      where: { providerId_districtId: { providerId: provider.id, districtId } },
    });

    if (!exist) {
      throw new AppError("Coverage tidak ditemukan.", 404);
    }

    return prisma.providerCoverage.delete({
      where: { providerId_districtId: { providerId: provider.id, districtId } },
    });
  }
}

module.exports = ProviderCoverageService;
