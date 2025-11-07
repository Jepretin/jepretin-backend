const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const {
  formatOrderSummary,
  formatOrderDetail,
} = require("../helpers/order.helper");

const ORDER_STATUS = [
  "PENDING",
  "PAID",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
];

// include presets
const orderSummaryInclude = {
  provider: { select: { id: true, user: { select: { name: true } } } },
};

const orderDetailInclude = {
  user: { select: { id: true, name: true } },
  provider: { select: { id: true, user: { select: { name: true } } } },
  customerAddress: {
    include: {
      village: {
        include: {
          district: {
            include: {
              regency: { include: { province: true } },
            },
          },
        },
      },
    },
  },
  orderItems: {
    include: {
      bundle: true,
      orderItemToppings: { include: { topping: true } },
    },
  },
};

class OrderService {
  static async addOrder({
    userId,
    providerId,
    addressId,
    eventDateTime,
    items,
  }) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          id: userId,
          isActive: true,
          deletedAt: null,
          isVerified: true,
        },
      });
      if (!user) throw new AppError("Akun belum terverifikasi", 403);

      const provider = await tx.provider.findUnique({
        where: { id: providerId },
      });
      if (!provider) throw new AppError("Provider tidak ditemukan", 404);

      const address = await tx.customerAddress.findFirst({
        where: { id: addressId, userId, deletedAt: null },
        include: { village: { include: { district: true } } },
      });
      if (!address) throw new AppError("Alamat tidak ditemukan", 404);

      const coverage = await tx.providerCoverage.findFirst({
        where: {
          providerId,
          districtId: address.village.district.id,
          deletedAt: null,
        },
      });
      if (!coverage)
        throw new AppError(
          "Alamat Anda berada di luar jangkauan provider",
          400
        );

      let totalPrice = 0;
      const order = await tx.order.create({
        data: {
          userId,
          providerId,
          addressId,
          eventDateTime,
          status: "PENDING",
          totalPrice: 0,
        },
      });

      for (const item of items) {
        let itemPrice = 0;
        let orderItem;

        if (item.bundleId) {
          const bundle = await tx.providerBundle.findUnique({
            where: { id: item.bundleId },
          });
          if (!bundle) throw new AppError("Bundle tidak ditemukan", 404);
          itemPrice += Number(bundle.price);
          orderItem = await tx.orderItem.create({
            data: {
              orderId: order.id,
              bundleId: bundle.id,
              price: bundle.price,
            },
          });
        }

        if (item.toppings?.length) {
          for (const toppingItem of item.toppings) {
            const topping = await tx.providerTopping.findUnique({
              where: { id: toppingItem.toppingId },
            });
            if (!topping)
              throw new AppError("Topping tambahan tidak ditemukan", 404);

            const toppingTotal =
              Number(topping.price) * (toppingItem.quantity || 1);
            itemPrice += toppingTotal;

            await tx.orderItemTopping.create({
              data: {
                orderItemId: orderItem.id,
                toppingId: topping.id,
                price: topping.price,
                quantity: toppingItem.quantity || 1,
              },
            });
          }
        }

        totalPrice += itemPrice;
      }

      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { totalPrice },
        include: orderDetailInclude,
      });

      return {
        message: "Pesanan berhasil dibuat",
        data: formatOrderDetail(updatedOrder),
      };
    });
  }

  static async getAllOrder() {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { id: true, name: true } },
        provider: { select: { id: true, user: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!orders.length) throw new AppError("Belum ada pesanan", 404);

    return {
      message: "Daftar semua pesanan berhasil diambil",
      data: orders.map(formatOrderSummary),
    };
  }

  static async getMyOrders(userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true, deletedAt: null, isVerified: true },
    });
    if (!user) throw new AppError("Akun belum terverifikasi", 403);

    const orders = await prisma.order.findMany({
      where: { userId, deletedAt: null },
      include: orderSummaryInclude,
      orderBy: { createdAt: "desc" },
    });

    if (!orders.length) throw new AppError("Belum ada pesanan", 404);

    return {
      message: "Daftar pesanan berhasil diambil",
      data: orders.map(formatOrderSummary),
    };
  }

  static async getOrderById(userId, orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, deletedAt: null },
      include: orderDetailInclude,
    });
    if (!order) throw new AppError("Pesanan tidak ditemukan", 404);

    return {
      message: "Data Order berhasil diambil",
      data: formatOrderDetail(order),
    };
  }

  static async updateOrderStatus(orderId, status, userRole) {
    if (!["ADMIN", "PROVIDER"].includes(userRole))
      throw new AppError(
        "Hanya admin atau provider yang dapat mengubah status",
        403
      );

    if (!ORDER_STATUS.includes(status))
      throw new AppError("Status tidak valid", 400);

    const order = await prisma.order.findUnique({
      where: { id: orderId, deletedAt: null },
      include: orderDetailInclude,
    });
    if (!order) throw new AppError("Pesanan tidak ditemukan", 404);

    if (order.status === "COMPLETED" && status !== "REFUNDED")
      throw new AppError("Pesanan yang selesai tidak dapat diubah lagi", 400);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: orderDetailInclude,
    });

    await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "SYSTEM",
        message: `Status pesanan Anda diperbarui menjadi ${status}`,
        isRead: false,
      },
    });

    return {
      message: `Status pesanan berhasil diperbarui menjadi ${status}`,
      data: formatOrderDetail(updatedOrder),
    };
  }
}

module.exports = OrderService;
