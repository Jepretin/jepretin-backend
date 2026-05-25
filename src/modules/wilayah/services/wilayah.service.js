const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class WilayahService {
  static async getProvinces() {
    const province = await prisma.province.findMany();
    return { total: province.length, data: province };
  }

  static async getRegencies(provinceId) {
    const regency = await prisma.regency.findMany({
      where: { provinceId },
    });
    return { total: regency.length, data: regency };
  }

  static async getDistricts(regencyId) {
    const district = await prisma.district.findMany({
      where: { regencyId },
    });
    return { total: district.length, data: district };
  }

  static async getVillages(districtId) {
    const village = await prisma.village.findMany({
      where: { districtId },
    });
    return { total: village.length, data: village };
  }
}

module.exports = WilayahService;
