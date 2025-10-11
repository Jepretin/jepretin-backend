const ProviderService = require("../services/provider.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class ProviderController {
  static registerProvider = handleAsync(async (req, res) => {
    const { experience, roles } = req.body;
    const userId = req.user.id;

    const provider = await ProviderService.registerProvider({
      userId,
      experience,
      roleIds: roles,
    });

    return success(res, 201, "Provider berhasil diregistrasi.", provider);
  });

  static getAllProvider = handleAsync(async (req, res) => {
    const providers = await ProviderService.getAllProvider();
    return success(res, 200, "Daftar provider berhasil diambil.", providers);
  });

  static getProviderById = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const provider = await ProviderService.getProviderById(userId);

    return success(res, 200, "Provider ditemukan.", provider);
  });

  static updateExperience = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { experience } = req.body;

    const updated = await ProviderService.updateExperience(userId, experience);
    return success(res, 200, "Experience berhasil diperbarui.", updated);
  });

  static updateStatus = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userRole = req.user.role;

    const updated = await ProviderService.updateStatus(id, status, userRole);
    return success(res, 200, "Status provider berhasil diperbarui.", updated);
  });

  static deleteProvider = handleAsync(async (req, res) => {
    const userId = req.user.id;

    await ProviderService.deleteProvider(userId);
    return success(res, 200, "Provider berhasil dihapus.");
  });
}

module.exports = ProviderController;
