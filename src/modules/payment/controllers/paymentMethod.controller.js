const PaymentMethodService = require("../services/paymentMethod.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class PaymentMethodController {
  // Tambah metode pembayaran baru
  static addPaymentMethod = handleAsync(async (req, res) => {
    const { name, provider, categoryId } = req.body;

    const result = await PaymentMethodService.addPaymentMethod({
      name,
      provider,
      categoryId,
    });

    return success(res, 201, "Metode pembayaran berhasil ditambah.", result);
  });

  // Ambil semua method pembayaran
  static getPaymentMethod = handleAsync(async (req, res) => {
    const result = await PaymentMethodService.getPaymentMethod();
    return success(
      res,
      200,
      "Daftar Metode pembayaran berhasil diambil.",
      result
    );
  });

  // Hapus method pembayaran
  static removePaymentMethod = handleAsync(async (req, res) => {
    const { id } = req.params;

    await PaymentMethodService.removePaymentMethod(id);
    return success(res, 200, "Metode pembayaran berhasil dihapus.");
  });
}

module.exports = PaymentMethodController;
