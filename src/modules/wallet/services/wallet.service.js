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

  // static async initializeWallet(providerId) {
  //   const existingWallet = await prisma.wallet.findFirst({
  //     where: { providerId, deletedAt: null },
  //   });

  //   if (existingWallet) {
  //     return {
  //       message: "Wallet sudah terdaftar untuk provider ini",
  //       data: existingWallet,
  //     };
  //   }

  //   const wallet = await prisma.wallet.create({
  //     data: {
  //       providerId,
  //       currentBalance: 0,
  //       pendingBalance: 0,
  //     },
  //   });

  //   return {
  //     message: "Wallet berhasil dibuat",
  //     data: wallet,
  //   };
  // }

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

  static async creditFromPayment(paymentId) {
    return await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id: paymentId, deletedAt: null },
        include: {
          order: {
            include: { provider: true },
          },
        },
      });

      if (!payment) throw new AppError("Data pembayaran tidak ditemukan", 404);
      if (!payment.order)
        throw new AppError("Pembayaran tidak terkait dengan order", 400);

      const wallet = await tx.wallet.findFirst({
        where: { providerId: payment.order.providerId, deletedAt: null },
      });

      if (!wallet)
        throw new AppError("Wallet provider belum diinisialisasi", 400);

      const amount = Number(payment.netAmount || payment.amount);
      const newBalance = Number(wallet.currentBalance) + amount;

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { currentBalance: newBalance },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          orderId: payment.orderId,
          amount,
          type: "CREDIT",
          status: "SUCCESS",
          description: `Pembayaran order ${payment.orderId} berhasil dikreditkan`,
        },
      });

      return {
        message: "Saldo provider berhasil dikreditkan dari pembayaran",
        data: {
          walletId: wallet.id,
          creditedAmount: amount,
          currentBalance: updatedWallet.currentBalance,
        },
      };
    });
  }
}

module.exports = WalletService;
