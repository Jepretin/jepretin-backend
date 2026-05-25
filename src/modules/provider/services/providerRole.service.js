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

    const existing = await prisma.providerRole.findFirst({
      where: { providerId, roleId },
    });

    if (existing) {
      if (existing.deletedAt) {
        return prisma.providerRole.update({
          where: { id: existing.id },
          data: { deletedAt: null },
        });
      }
      throw new AppError("Provider sudah memiliki role ini", 400);
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

  static async createRole(name) {
    const existing = await prisma.role.findFirst({
      where: { name, deletedAt: null },
    });
    if (existing) throw new AppError("Role dengan nama ini sudah ada", 400);

    return prisma.role.create({
      data: { name },
    });
  }

  static async updateRole(id, name) {
    const role = await prisma.role.findFirst({
      where: { id, deletedAt: null },
    });
    if (!role) throw new AppError("Role tidak ditemukan", 404);

    const duplicate = await prisma.role.findFirst({
      where: { name, deletedAt: null, id: { not: id } },
    });
    if (duplicate) throw new AppError("Role dengan nama ini sudah ada", 400);

    return prisma.role.update({
      where: { id },
      data: { name },
    });
  }

  static async removeRole(providerId, roleId) {
    const providerRole = await prisma.providerRole.findFirst({
      where: { providerId, roleId, deletedAt: null },
    });
    if (!providerRole) {
      throw new AppError("ProviderRole tidak ditemukan atau sudah dihapus", 404);
    }

    return prisma.providerRole.update({
      where: { id: providerRole.id },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = ProviderRoleService;
