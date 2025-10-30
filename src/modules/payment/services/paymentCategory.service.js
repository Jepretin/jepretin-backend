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
