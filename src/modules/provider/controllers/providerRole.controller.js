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

  static createRole = handleAsync(async (req, res) => {
    const { name } = req.body;

    const result = await ProviderRoleService.createRole(name);
    return success(res, 201, "Role berhasil dibuat", result);
  });

  static updateRole = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    const result = await ProviderRoleService.updateRole(id, name);
    return success(res, 200, "Role berhasil diperbarui", result);
  });
}

module.exports = ProviderRoleController;
