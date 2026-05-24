// src/modules/wallet/services/wallet.service.js
const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class WalletService {
  static async getWalletByProvider(providerId) {
    const wallet = await prisma.wallet.findFirst({
      where: { providerId, deletedAt: null },
    });

    if (!wallet) throw new AppError("Wallet tidak ditemukan", 404);

    return {
      message: "Data wallet berhasil diambil",
      data: {
        id: wallet.id,
        providerId: wallet.providerId,
        currentBalance: Number(wallet.currentBalance),
        pendingBalance: Number(wallet.pendingBalance),
        currency: wallet.currency,
        lastPayoutAt: wallet.lastPayoutAt,
      },
    };
  }

  static async updateBalance({
    walletId,
    amount,
    type,
    orderId = null,
    description = null,
  }) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) throw new AppError("Wallet tidak ditemukan", 404);
      if (amount <= 0) throw new AppError("Nominal harus lebih dari 0", 400);

      let newBalance = Number(wallet.currentBalance);

      if (type === "CREDIT") {
        newBalance += Number(amount);
      } else if (type === "DEBIT") {
        if (wallet.currentBalance < amount) {
          throw new AppError("Saldo tidak mencukupi", 400);
        }
        newBalance -= Number(amount);
      } else {
        throw new AppError("Tipe transaksi tidak valid", 400);
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: { currentBalance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          walletId,
          orderId,
          amount,
          type,
          status: "SUCCESS",
          description:
            description ||
            (type === "CREDIT" ? "Saldo bertambah" : "Saldo berkurang"),
        },
      });

      return {
        message: `Saldo wallet berhasil di${
          type === "CREDIT" ? "tambahkan" : "kurangi"
        }`,
        data: {
          walletId,
          currentBalance: updatedWallet.currentBalance,
        },
      };
    });
  }
}

module.exports = WalletService;
