const { PrismaClient } = require("@prisma/client");
const prisma = require("../../../services/prisma.service");
class WilayahService {
  static async getProvinces() {
    return prisma.province.findMany();
  }

  static async getRegencies(provinceId) {
    return prisma.regency.findMany({
      where: { provinceId },
    });
  }

  static async getDistricts(regencyId) {
    return prisma.district.findMany({
      where: { regencyId },
    });
  }

  static async getVillages(districtId) {
    return prisma.village.findMany({
      where: { districtId },
    });
  }
}

module.exports = WilayahService;
