// src/modules/wilayah/controller/wilayah.controller.js
const WilayahService = require("../../wilayah/services/wilayah.service");
const { success, error } = require("../../../utils/response");

class WilayahController {
  static async getProvinces(req, res) {
    try {
      const provinces = await WilayahService.getProvinces();
      return success(res, 200, "Berhasil mengambil data Provinsi", provinces);
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal mengambil data Provinsi";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async getRegencies(req, res) {
    try {
      const { provinceId } = req.params;
      const regencies = await WilayahService.getRegencies(provinceId);
      return success(
        res,
        200,
        "Berhasil mengambil data Kabupaten/Kota",
        regencies
      );
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal mengambil data Kabupaten/Kota";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async getDistricts(req, res) {
    try {
      const { regencyId } = req.params;
      const districts = await WilayahService.getDistricts(regencyId);
      return success(res, 200, "Berhasil mengambil data Kecamatan", districts);
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal mengambil data Kecamatan";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async getVillages(req, res) {
    try {
      const { districtId } = req.params;
      const villages = await WilayahService.getVillages(districtId);
      return success(res, 200, "Berhasil mengambil data Desa", villages);
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal mengambil data Desa";
      return error(res, status, message, { detail: err.message });
    }
  }
}

module.exports = WilayahController;
