const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ProviderRoleService {
  static async assignRole(providerId, roleId) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError("Role tidak ditemukan", 404);
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!provider) {
      throw new AppError("Provider tidak ditemukan", 404);
    }

    return prisma.providerRole.create({
      data: { providerId, roleId },
    });
  }

  static async getRoles() {
    return prisma.role.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }
  static async removeRole(providerId, roleId) {
    try {
      return await prisma.providerRole.delete({
        where: {
          providerId_roleId: { providerId, roleId },
        },
      });
    } catch (err) {
      throw new AppError(
        "ProviderRole tidak ditemukan atau sudah dihapus",
        404
      );
    }
  }
}

module.exports = ProviderRoleService;
