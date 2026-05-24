const WalletService = require("../services/wallet.service");
const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class WalletController {
  static getMyWallet = handleAsync(async (req, res) => {
    const provider = await prisma.provider.findUnique({
      where: { userId: req.user.id },
    });
    if (!provider) throw new AppError("Provider tidak ditemukan", 404);

    const result = await WalletService.getWalletByProvider(provider.id);

    return success(res, 200, "Data wallet berhasil diambil", result);
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
}

module.exports = WalletController;
