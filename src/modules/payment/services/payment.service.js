const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const midtransClient = require("midtrans-client");
const crypto = require("crypto");

class PaymentService {
  static async createPayment({ userId, orderId }) {
    return await prisma.$transaction(async (tx) => {
      // 1) Validasi order
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });

      if (!order) throw new AppError("Order tidak ditemukan", 404);
      if (order.userId !== userId)
        throw new AppError("Anda bukan pemilik order", 403);
      if (order.deletedAt) throw new AppError("Order tidak valid", 400);
      if (order.status !== "PENDING")
        throw new AppError("Order tidak dalam status yang dapat dibayar", 400);

      // 2) Tentukan amount
      const amount = Number(order.totalPrice);
      if (!amount || amount <= 0)
        throw new AppError("Jumlah pembayaran tidak valid", 400);

      // 3) Generate transactionId
      const transactionId = `PAY-${crypto.randomUUID()}`;

      // 4) Buat record pembayaran
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount,
          transactionId,
          status: "PENDING",
        },
      });

      // 5) Buat Snap instance
      const snap = new midtransClient.Snap({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
        serverKey: process.env.MIDTRANS_SERVER_KEY,
      });

      // 6) Payload transaksi Midtrans
      const snapPayload = {
        transaction_details: {
          order_id: payment.transactionId,
          gross_amount: Math.round(amount),
        },
        credit_card: { secure: true },
        customer_details: {
          first_name: order.user?.name || "Customer",
          email: order.user?.email || undefined,
          phone: order.user?.phone || undefined,
        },
        item_details: [
          {
            id: order.id,
            price: Math.round(amount),
            quantity: 1,
            name: `Order ${order.id}`,
          },
        ],
      };

      // 7) Dapatkan Snap Token dari Midtrans
      const snapResponse = await snap.createTransaction(snapPayload);

      // 8) Simpan token/response
      await tx.payment.update({
        where: { id: payment.id },
        data: { rawResponse: snapResponse },
      });

      // 9) Return ke client
      return {
        id: payment.id,
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        amount: Number(payment.amount),
        status: payment.status,
        snapToken: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
      };
    });
  }

  static async handleWebhook(payload, signatureKey) {
    // Validasi signature Midtrans
    const expectedSignature = crypto
      .createHash("sha512")
      .update(
        payload.order_id +
          payload.status_code +
          payload.gross_amount +
          process.env.MIDTRANS_SERVER_KEY
      )
      .digest("hex");

    if (expectedSignature !== signatureKey) {
      throw new AppError(
        "Signature tidak valid (kemungkinan spoofed request)",
        403
      );
    }

    // Ambil transactionId dari payload
    const transactionId = payload.order_id;

    // Cari payment berdasarkan transactionId
    const payment = await prisma.payment.findUnique({
      where: { transactionId },
      include: { order: true },
    });

    if (!payment) {
      throw new AppError("Payment tidak ditemukan", 404);
    }

    // Tentukan status baru berdasarkan `transaction_status`
    let newStatus;
    let paidAt = null;

    switch (payload.transaction_status) {
      case "settlement":
        newStatus = "SUCCESS";
        paidAt = new Date();
        break;
      case "pending":
        newStatus = "PENDING";
        break;
      case "cancel":
      case "deny":
      case "expire":
        newStatus = "FAILED";
        break;
      default:
        newStatus = payment.status;
    }

    // Update payment di database
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paidAt,
        rawResponse: payload,
      },
    });

    // Jika SUCCESS, update status order juga
    if (newStatus === "SUCCESS") {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "PAID" },
      });
    }

    return { message: "Webhook diterima dan diproses", status: newStatus };
  }

  static async getPaymentsByUser(userId) {
    return await prisma.$transaction(async (tx) => {
      const payments = await tx.payment.findMany({
        where: {
          deletedAt: null,
          order: {
            userId,
            deletedAt: null,
          },
        },
        include: {
          order: {
            select: {
              status: true,
              totalPrice: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formatted = payments.map((p) => ({
        id: p.id,
        transactionId: p.transactionId,
        orderId: p.orderId,
        amount: Number(p.amount),
        status: p.status,
        paymentDate: p.paidAt,
        redirectUrl: p.rawResponse?.redirect_url || null,
        order: p.order
          ? {
              status: p.order.status,
              totalPrice: Number(p.order.totalPrice),
              createdAt: p.order.createdAt,
            }
          : null,
      }));

      return formatted;
    });
  }

  static async getPaymentById(userId, paymentId) {
    return await prisma.$transaction(async (tx) => {
      // Validasi user
      const user = await tx.user.findFirst({
        where: {
          id: userId,
          isActive: true,
          deletedAt: null,
          isVerified: true,
        },
      });
      if (!user) throw new AppError("Akun belum terverifikasi", 403);

      // Ambil detail pembayaran
      const payment = await tx.payment.findFirst({
        where: {
          id: paymentId,
          deletedAt: null,
          order: {
            userId,
            deletedAt: null,
          },
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
              totalPrice: true,
              createdAt: true,
              orderItems: {
                include: {
                  bundle: true,
                  orderItemToppings: { include: { topping: true } },
                },
              },
            },
          },
        },
      });

      if (!payment) throw new AppError("Pembayaran tidak ditemukan", 404);

      // Format response
      return {
        id: payment.id,
        transactionId: payment.transactionId,
        orderId: payment.orderId,
        amount: Number(payment.amount),
        status: payment.status,
        paymentDate: payment.paidAt,
        redirectUrl: payment.rawResponse?.redirect_url || null,
        order: payment.order
          ? {
              id: payment.order.id,
              status: payment.order.status,
              totalPrice: Number(payment.order.totalPrice),
              createdAt: payment.order.createdAt,
              items: payment.order.orderItems.map((item) => ({
                id: item.id,
                bundle: item.bundle
                  ? {
                      id: item.bundle.id,
                      name: item.bundle.name,
                      price: Number(item.bundle.price),
                    }
                  : null,
                price: Number(item.price),
                toppings: item.orderItemToppings.map((t) => ({
                  id: t.topping.id,
                  name: t.topping.name,
                  price: Number(t.price),
                  quantity: t.quantity,
                })),
              })),
            }
          : null,
      };
    });
  }
}

module.exports = PaymentService;
