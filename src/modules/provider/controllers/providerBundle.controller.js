const ProviderBundleService = require("../services/providerBundle.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class ProviderBundleController {
  static createBundle = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { name, description, price } = req.body;

    const data = await ProviderBundleService.createBundle({
      userId,
      name,
      description,
      price,
    });

    return success(res, 201, "Provider bundle berhasil ditambahkan.", data);
  });

  static getAllBundle = handleAsync(async (req, res) => {
    const data = await ProviderBundleService.getAllBundle();
    return success(
      res,
      200,
      "Berhasil mendapatkan semua provider bundle.",
      data
    );
  });

  static getMyBundle = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const data = await ProviderBundleService.getMyBundle(userId);
    return success(res, 200, "Berhasil mendapatkan bundle milik Anda.", data);
  });

  static getBundleById = handleAsync(async (req, res) => {
    const { providerId } = req.params;
    const data = await ProviderBundleService.getBundleById(providerId);
    return success(res, 200, "Berhasil mendapatkan bundle provider.", data);
  });

  static updateBundle = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, price } = req.body;

    const data = await ProviderBundleService.updateBundle({
      id: id,
      userId,
      name,
      description,
      price,
    });

    return success(res, 200, "Provider bundle berhasil diperbarui.", data);
  });

  static deleteBundle = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const data = await ProviderBundleService.deleteBundle(id, userId);
    return success(res, 200, data.message);
  });
}

module.exports = ProviderBundleController;
