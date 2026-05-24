const ProviderAvailabilityService = require("../services/providerAvailability.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class ProviderAvailabilityController {
  static addAvailability = handleAsync(async (req, res) => {
    const { startDate, endDate, isAvailable } = req.body;
    const userId = req.user.id;

    const result = await ProviderAvailabilityService.addAvailability({
      userId,
      startDate,
      endDate,
      isAvailable,
    });

    return success(res, 201, result.message, result.data);
  });

  static getMyAvailabilities = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await ProviderAvailabilityService.getMyAvailabilities(userId);
    return success(res, 200, "Data ketersediaan berhasil diambil", result);
  });

  static getAvailabilityById = handleAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await ProviderAvailabilityService.getAvailabilityById(
      userId,
      id
    );
    return success(res, 200, "Data ketersediaan berhasil diambil", result);
  });

  static updateAvailability = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, isAvailable } = req.body;
    const userId = req.user.id;

    const result = await ProviderAvailabilityService.updateAvailability({
      userId,
      availabilityId: id,
      startDate,
      endDate,
      isAvailable,
    });

    return success(res, 200, result.message, result.data);
  });

  static deleteAvailability = handleAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await ProviderAvailabilityService.deleteAvailability(
      userId,
      id
    );
    return success(res, 200, result.message);
  });
}

module.exports = ProviderAvailabilityController;
