const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");
const ProviderRoleService = require("../services/providerRole.service");

class ProviderRoleController {
  static assignRole = handleAsync(async (req, res) => {
    const { providerId, roleId } = req.body;

    const result = await ProviderRoleService.assignRole(providerId, roleId);

    return success(res, 200, "Role berhasil ditambahkan ke Provider.", result);
  });

  static getRolesByProvider = handleAsync(async (req, res) => {
    const providerId = req.params.providerId;
    const roles = await ProviderRoleService.getRolesByProvider(providerId);
    return success(res, 200, "Daftar Provider Role berhasil diambil", roles);
  });

  static removeRole = handleAsync(async (req, res) => {
    const { providerId, roleId } = req.body;
    await ProviderRoleService.removeRole(providerId, roleId);
    return success(res, 200, "Provider Role berhasil dihapus");
  });
}

module.exports = ProviderRoleController;
