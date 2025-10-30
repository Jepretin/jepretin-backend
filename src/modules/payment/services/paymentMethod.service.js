const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class PaymentMethodService {
  // Tambah metode pembayaran baru
  static async addPaymentMethod({ name, provider, categoryId }) {
    const existing = await prisma.paymentMethod.findFirst({
      where: { name, categoryId, deletedAt: null },
    });

    if (existing) throw new AppError("Nama method sudah ada.", 400);

    const category = await prisma.paymentCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new AppError("Kategori tidak ada/tidak valid.", 400);

    const method = await prisma.paymentMethod.create({
      data: { name, provider, categoryId },
    });

    return {
      id: method.id,
      name: method.name,
      provider: method.provider,
      categoryId: method.categoryId,
      createdAt: method.createdAt,
    };
  }

  // Ambil semua metode pembayaran aktif
  static async getPaymentMethod() {
    return prisma.paymentMethod.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        provider: true,
        categoryId: true,
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  // Soft delete metode pembayaran
  static async removePaymentMethod(id) {
    const method = await prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!method) {
      throw new AppError("metode pembayaran tidak ditemukan", 404);
    }

    return prisma.paymentMethod.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = PaymentMethodService;
