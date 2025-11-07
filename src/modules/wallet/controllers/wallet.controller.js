// src/modules/wallet/controllers/wallet.controller.js
const WalletService = require("../services/wallet.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class WalletController {
  static getMyWallet = handleAsync(async (req, res) => {
    const providerId = req.user.providerId;

    const result = await WalletService.getWalletByProvider(providerId);

    return success(res, 200, "Data wallet berhasil diambil", result);
  });

  static initializeWallet = handleAsync(async (req, res) => {
    const providerId = req.user.providerId;

    const result = await WalletService.initializeWallet(providerId);

    return success(res, 201, "Wallet berhasil dibuat", result);
  });

  static updateBalance = handleAsync(async (req, res) => {
    const { walletId, amount, type, orderId, description } = req.body;

    const result = await WalletService.updateBalance({
      walletId,
      amount,
      type,
      orderId,
      description,
    });

    return success(
      res,
      200,
      `Saldo wallet berhasil di${type === "CREDIT" ? "tambahkan" : "kurangi"}`,
      result
    );
  });

  static creditFromPayment = handleAsync(async (req, res) => {
    const { paymentId } = req.body;

    const result = await WalletService.creditFromPayment(paymentId);

    return success(
      res,
      200,
      "Saldo provider berhasil dikreditkan dari pembayaran",
      result
    );
  });
}

module.exports = WalletController;
