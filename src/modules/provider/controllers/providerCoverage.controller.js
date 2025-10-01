const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");
const ProviderCoverageService = require("../services/providerCoverage.service");

class ProviderCoverageController {
  static addCoverage = handleAsync(async (req, res) => {
    const { districtId } = req.body;
    const userId = req.user.id;

    const coverage = await ProviderCoverageService.addCoverage({
      userId,
      districtId,
    });

    return success(res, 201, "Coverage berhasil ditambahkan", coverage);
  });

  static getProviderCoverage = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const coverages = await ProviderCoverageService.getProviderCoverage(userId);

    return success(res, 200, "Daftar Coverage provider", coverages);
  });

  static findProvidersByDistrict = handleAsync(async (req, res) => {
    const { districtId } = req.params;
    const providers = await ProviderCoverageService.findProvidersByDistrict(
      districtId
    );

    return success(res, 200, "Daftar provider di distrik ini", providers);
  });

  static removeCoverage = handleAsync(async (req, res) => {
    const { districtId } = req.params;
    const userId = req.user.id;

    await ProviderCoverageService.removeCoverage(userId, districtId);
    return success(res, 200, "Coverage berhasil dihapus.");
  });
}

module.exports = ProviderCoverageController;
