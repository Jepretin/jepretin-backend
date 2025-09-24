const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class WilayahService {
  static async getProvinces() {
    const province = await prisma.province.findMany();
    if (!province || province.length === 0) {
      throw new AppError("Data Provinsi tidak ditemukan.", 404);
    }
    return province;
  }

  static async getRegencies(provinceId) {
    const regency = await prisma.regency.findMany({
      where: { provinceId },
    });
    if (!regency || regency.length === 0) {
      throw new AppError("Data Kabupaten/Kota tidak ditemukan.", 404);
    }
    return regency;
  }

  static async getDistricts(regencyId) {
    const district = await prisma.district.findMany({
      where: { regencyId },
    });
    if (!district || district.length === 0) {
      throw new AppError("Data Distrik tidak ditemukan.", 404);
    }
    return district;
  }

  static async getVillages(districtId) {
    const village = await prisma.village.findMany({
      where: { districtId },
    });
    if (!village || village.length === 0) {
      throw new AppError("Data Desa tidak ditemukan.", 404);
    }
    return village;
  }
}

module.exports = WilayahService;
