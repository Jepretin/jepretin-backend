const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class PaymentCategoryService {
  // Tambah kategori pembayaran baru
  static async addPaymentCategory({ name, description }) {
    const existing = await prisma.paymentCategory.findFirst({
      where: { name, deletedAt: null },
    });
    if (existing) throw new AppError("Nama kategori sudah ada", 400);

    const category = await prisma.paymentCategory.create({
      data: { name, description },
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
    };
  }

  // Ambil semua kategori pembayaran aktif
  static async getPaymentCategory() {
    return prisma.paymentCategory.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
  }

  static async updatePaymentCategory(id, { name, description }) {
    const category = await prisma.paymentCategory.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new AppError("Kategori pembayaran tidak ditemukan", 404);

    if (name) {
      const duplicate = await prisma.paymentCategory.findFirst({
        where: { name, deletedAt: null, id: { not: id } },
      });
      if (duplicate) throw new AppError("Nama kategori sudah ada", 400);
    }

    return prisma.paymentCategory.update({
      where: { id },
      data: {
        name: name ?? category.name,
        description: description !== undefined ? description : category.description,
      },
    });
  }

  // Soft delete kategori pembayaran
  static async removePaymentCategory(id) {
    const category = await prisma.paymentCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new AppError("Kategori pembayaran tidak ditemukan", 404);
    }

    return prisma.paymentCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = PaymentCategoryService;
