const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class WithdrawalService {
  static async requestWithdrawal({
    userId,
    amount,
    bankName,
    bankAccountNumber,
    bankAccountName,
  }) {
    return await prisma.$transaction(async (tx) => {
      const provider = await tx.provider.findUnique({
        where: { userId },
      });
      if (!provider) throw new AppError("Provider tidak ditemukan", 404);

      if (provider.status !== "ACCEPTED") {
        throw new AppError(
          "Hanya provider yang sudah diterima yang dapat melakukan penarikan",
          403
        );
      }

      const wallet = await tx.wallet.findFirst({
        where: { providerId: provider.id, deletedAt: null },
      });
      if (!wallet) throw new AppError("Wallet tidak ditemukan", 404);

      const currentBalance = Number(wallet.currentBalance);
      if (currentBalance < amount) {
        throw new AppError(
          `Saldo tidak mencukupi. Saldo saat ini: Rp${currentBalance.toLocaleString("id-ID")}`,
          400
        );
      }

      const pendingBalance = Number(wallet.pendingBalance);

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          currentBalance: currentBalance - amount,
          pendingBalance: pendingBalance + amount,
        },
      });

      const withdrawalRequest = await tx.withdrawalRequest.create({
        data: {
          providerId: provider.id,
          walletId: wallet.id,
          amount,
          bankName,
          bankAccountNumber,
          bankAccountName,
          status: "PENDING",
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          withdrawalRequestId: withdrawalRequest.id,
          amount,
          type: "DEBIT",
          status: "PENDING",
          description: `Penarikan dana Rp${amount.toLocaleString("id-ID")} ke ${bankName} - ${bankAccountNumber}`,
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: "SYSTEM",
          message: `Permintaan penarikan dana sebesar Rp${amount.toLocaleString("id-ID")} sedang diproses`,
          isRead: false,
        },
      });

      return {
        message: "Permintaan penarikan berhasil dibuat",
        data: {
          id: withdrawalRequest.id,
          amount,
          bankName,
          bankAccountNumber,
          bankAccountName,
          status: withdrawalRequest.status,
          createdAt: withdrawalRequest.createdAt,
        },
      };
    });
  }

  static async getMyRequests(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });
    if (!provider) throw new AppError("Provider tidak ditemukan", 404);

    const requests = await prisma.withdrawalRequest.findMany({
      where: { providerId: provider.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        wallet: { select: { currentBalance: true, pendingBalance: true } },
      },
    });

    if (!requests.length) {
      return { total: 0, data: [] };
    }

    return {
      total: requests.length,
      data: requests.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        bankName: r.bankName,
        bankAccountNumber: r.bankAccountNumber,
        bankAccountName: r.bankAccountName,
        status: r.status,
        note: r.note,
        currentBalance: Number(r.wallet.currentBalance),
        pendingBalance: Number(r.wallet.pendingBalance),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  static async getAllRequests() {
    const requests = await prisma.withdrawalRequest.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        provider: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        wallet: { select: { currentBalance: true, pendingBalance: true } },
      },
    });

    if (!requests.length) {
      return { total: 0, data: [] };
    }

    return {
      total: requests.length,
      data: requests.map((r) => ({
        id: r.id,
        providerId: r.providerId,
        providerName: r.provider.user.name,
        providerEmail: r.provider.user.email,
        amount: Number(r.amount),
        bankName: r.bankName,
        bankAccountNumber: r.bankAccountNumber,
        bankAccountName: r.bankAccountName,
        status: r.status,
        note: r.note,
        attemptedAt: r.attemptedAt,
        attemptCount: r.attemptCount,
        currentBalance: Number(r.wallet.currentBalance),
        pendingBalance: Number(r.wallet.pendingBalance),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  static async getRequestById(userId, requestId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AppError("User tidak ditemukan", 404);

    const request = await prisma.withdrawalRequest.findFirst({
      where: { id: requestId, deletedAt: null },
      include: {
        provider: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        wallet: { select: { currentBalance: true, pendingBalance: true } },
        transactions: {
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            description: true,
            createdAt: true,
          },
        },
      },
    });

    if (!request) {
      throw new AppError("Permintaan penarikan tidak ditemukan", 404);
    }

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    const isOwner = provider && request.providerId === provider.id;

    if (!isOwner && user.role !== "ADMIN") {
      throw new AppError("Anda tidak memiliki akses ke data ini", 403);
    }

    return {
      data: {
        id: request.id,
        providerId: request.providerId,
        providerName: request.provider.user.name,
        providerEmail: request.provider.user.email,
        amount: Number(request.amount),
        bankName: request.bankName,
        bankAccountNumber: request.bankAccountNumber,
        bankAccountName: request.bankAccountName,
        status: request.status,
        note: request.note,
        attemptedAt: request.attemptedAt,
        attemptCount: request.attemptCount,
        currentBalance: Number(request.wallet.currentBalance),
        pendingBalance: Number(request.wallet.pendingBalance),
        transactions: request.transactions.map((t) => ({
          id: t.id,
          amount: Number(t.amount),
          type: t.type,
          status: t.status,
          description: t.description,
          createdAt: t.createdAt,
        })),
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    };
  }

  static async approveRequest(requestId, note) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({
        where: { id: requestId },
        include: {
          provider: {
            include: { user: { select: { id: true, name: true } } },
          },
          wallet: true,
        },
      });

      if (!request) {
        throw new AppError("Permintaan penarikan tidak ditemukan", 404);
      }

      if (request.status !== "PENDING") {
        throw new AppError(
          `Tidak dapat menyetujui penarikan dengan status ${request.status}`,
          400
        );
      }

      const pendingBalance = Number(request.wallet.pendingBalance);
      const amount = Number(request.amount);

      await tx.wallet.update({
        where: { id: request.walletId },
        data: {
          pendingBalance: pendingBalance - amount,
          lastPayoutAt: new Date(),
        },
      });

      await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          note: note || null,
          attemptedAt: new Date(),
          attemptCount: request.attemptCount + 1,
        },
      });

      await tx.walletTransaction.updateMany({
        where: {
          withdrawalRequestId: requestId,
          type: "DEBIT",
          status: "PENDING",
        },
        data: { status: "SUCCESS" },
      });

      await tx.notification.create({
        data: {
          userId: request.provider.userId,
          type: "SYSTEM",
          message: `Penarikan dana sebesar Rp${amount.toLocaleString("id-ID")} telah disetujui`,
          isRead: false,
        },
      });

      return {
        message: "Penarikan dana telah disetujui",
        data: {
          id: request.id,
          providerName: request.provider.user.name,
          amount,
          bankName: request.bankName,
          status: "APPROVED",
        },
      };
    });
  }

  static async rejectRequest(requestId, note) {
    return await prisma.$transaction(async (tx) => {
      const request = await tx.withdrawalRequest.findUnique({
        where: { id: requestId },
        include: {
          provider: {
            include: { user: { select: { id: true, name: true } } },
          },
          wallet: true,
        },
      });

      if (!request) {
        throw new AppError("Permintaan penarikan tidak ditemukan", 404);
      }

      if (request.status !== "PENDING") {
        throw new AppError(
          `Tidak dapat menolak penarikan dengan status ${request.status}`,
          400
        );
      }

      const amount = Number(request.amount);
      const currentBalance = Number(request.wallet.currentBalance);
      const pendingBalance = Number(request.wallet.pendingBalance);

      await tx.wallet.update({
        where: { id: request.walletId },
        data: {
          currentBalance: currentBalance + amount,
          pendingBalance: pendingBalance - amount,
        },
      });

      await tx.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          note,
          attemptedAt: new Date(),
          attemptCount: request.attemptCount + 1,
        },
      });

      await tx.walletTransaction.updateMany({
        where: {
          withdrawalRequestId: requestId,
          type: "DEBIT",
          status: "PENDING",
        },
        data: { status: "FAILED" },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: request.walletId,
          withdrawalRequestId: requestId,
          amount,
          type: "CREDIT",
          status: "SUCCESS",
          description: `Refund penarikan ditolak: ${note}`,
        },
      });

      await tx.notification.create({
        data: {
          userId: request.provider.userId,
          type: "SYSTEM",
          message: `Penarikan dana sebesar Rp${amount.toLocaleString("id-ID")} ditolak. Alasan: ${note}`,
          isRead: false,
        },
      });

      return {
        message: "Penarikan dana telah ditolak",
        data: {
          id: request.id,
          providerName: request.provider.user.name,
          amount,
          status: "REJECTED",
          note,
        },
      };
    });
  }
}

module.exports = WithdrawalService;
