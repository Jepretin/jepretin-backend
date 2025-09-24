const WilayahService = require("../../wilayah/services/wilayah.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class WilayahController {
  static getProvinces = handleAsync(async (req, res) => {
    const provinces = await WilayahService.getProvinces();
    return success(res, 200, "Berhasil mengambil data Provinsi", provinces);
  });

  static getRegencies = handleAsync(async (req, res) => {
    const { provinceId } = req.params;
    const regencies = await WilayahService.getRegencies(provinceId);
    return success(
      res,
      200,
      "Berhasil mengambil data Kabupaten/Kota",
      regencies
    );
  });

  static getDistricts = handleAsync(async (req, res) => {
    const { regencyId } = req.params;
    const districts = await WilayahService.getDistricts(regencyId);
    return success(res, 200, "Berhasil mengambil data Kecamatan", districts);
  });

  static getVillages = handleAsync(async (req, res) => {
    const { districtId } = req.params;
    const villages = await WilayahService.getVillages(districtId);
    return success(res, 200, "Berhasil mengambil data Desa", villages);
  });
}

module.exports = WilayahController;
