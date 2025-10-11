const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");
const ProviderRoleService = require("../services/providerRole.service");

class ProviderRoleController {
  static assignRole = handleAsync(async (req, res) => {
    const { providerId, roleId } = req.body;

    const result = await ProviderRoleService.assignRole(providerId, roleId);

    return success(res, 200, "Role berhasil ditambahkan ke Provider.", result);
  });

  static getRoles = handleAsync(async (req, res) => {
    const roles = await ProviderRoleService.getRoles();
    return success(res, 200, "Daftar Role berhasil diambil", roles);
  });

  static removeRole = handleAsync(async (req, res) => {
    const { providerId, roleId } = req.body;
    await ProviderRoleService.removeRole(providerId, roleId);
    return success(res, 200, "Provider Role berhasil dihapus");
  });
}

module.exports = ProviderRoleController;
