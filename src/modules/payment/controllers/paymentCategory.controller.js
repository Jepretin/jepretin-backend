const PaymentCategoryService = require("../services/paymentCategory.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class PaymentCategoryController {
  // Tambah kategori pembayaran baru
  static addPaymentCategory = handleAsync(async (req, res) => {
    const { name, description } = req.body;

    const result = await PaymentCategoryService.addPaymentCategory({
      name,
      description,
    });

    return success(res, 201, "Kategori pembayaran berhasil ditambah.", result);
  });

  // Ambil semua kategori pembayaran
  static getPaymentCategory = handleAsync(async (req, res) => {
    const result = await PaymentCategoryService.getPaymentCategory();
    return success(
      res,
      200,
      "Daftar kategori pembayaran berhasil diambil.",
      result
    );
  });

  // Hapus kategori pembayaran
  static removePaymentCategory = handleAsync(async (req, res) => {
    const { id } = req.params;

    await PaymentCategoryService.removePaymentCategory(id);
    return success(res, 200, "Kategori pembayaran berhasil dihapus.");
  });

  static updatePaymentCategory = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await PaymentCategoryService.updatePaymentCategory(id, {
      name,
      description,
    });
    return success(res, 200, "Kategori pembayaran berhasil diperbarui.", result);
  });
}

module.exports = PaymentCategoryController;
