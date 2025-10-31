const PaymentService = require("../services/payment.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class PaymentController {
  static createPayment = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { orderId } = req.body;

    const result = await PaymentService.createPayment({
      userId,
      orderId,
    });

    return success(res, 201, "pembayaran berhasil", result);
  });

  static handleWebhook = handleAsync(async (req, res) => {
    const signatureKey =
      req.headers["x-callback-signature"] ||
      req.headers["x-midtrans-signature"] ||
      req.body.signature_key;

    const payload = req.body;

    const result = await PaymentService.handleWebhook(payload, signatureKey);

    return success(res, 200, "Webhook diproses", result);
  });

  static getPaymentsByUser = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const payments = await PaymentService.getPaymentsByUser(userId);

    return success(res, 200, "Daftar pembayaran ditemukan", payments);
  });

  static getPaymentById = handleAsync(async (req, res) => {
    const { paymentId } = req.params;
    const userId = req.user.id;
    const data = await PaymentService.getPaymentById(userId, paymentId);

    return success(res, 200, "Data pembayaran berhasil diambil.", data);
  });
}

module.exports = PaymentController;
