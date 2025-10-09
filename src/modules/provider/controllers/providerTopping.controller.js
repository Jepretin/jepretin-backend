const ProviderToppingService = require("../services/providerTopping.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class ProviderToppingController {
  static createTopping = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { name, description, isStandalone, price, bundleId } = req.body;

    const data = await ProviderToppingService.createTopping({
      userId,
      name,
      description,
      isStandalone,
      price,
      bundleId,
    });

    return success(res, 201, "Provider topping berhasil ditambahkan.", data);
  });

  static getAllTopping = handleAsync(async (req, res) => {
    const data = await ProviderToppingService.getAllTopping();
    return success(
      res,
      200,
      "Berhasil mendapatkan semua provider topping.",
      data
    );
  });

  static getMyTopping = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const data = await ProviderToppingService.getMyTopping(userId);
    return success(res, 200, "Berhasil mendapatkan Topping milik Anda.", data);
  });

  static getToppingByProviderId = handleAsync(async (req, res) => {
    const { providerId } = req.params;
    const data = await ProviderToppingService.getToppingByProviderId(
      providerId
    );
    return success(res, 200, "Berhasil mendapatkan topping provider.", data);
  });

  static updateTopping = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, isStandalone, price, bundleId } = req.body;

    const data = await ProviderToppingService.updateTopping({
      id: id,
      userId,
      name,
      description,
      isStandalone,
      price,
      bundleId,
    });

    return success(res, 200, "Provider topping berhasil diperbarui.", data);
  });

  static deleteTopping = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const data = await ProviderToppingService.deleteTopping(id, userId);
    return success(res, 200, data.message);
  });
}

module.exports = ProviderToppingController;
