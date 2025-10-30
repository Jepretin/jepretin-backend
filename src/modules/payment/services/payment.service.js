const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const midtransClient = require("midtrans-client");
const { v4: uuidv4 } = require("uuid");
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
      const transactionId = `PAY-${uuidv4()}`;

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
}

module.exports = PaymentService;
