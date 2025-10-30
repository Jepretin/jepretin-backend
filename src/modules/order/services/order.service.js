const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const { formatOrderResponse } = require("../../order/helpers/order.helper");

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
        include: {
          village: { include: { district: true } },
        },
      });
      if (!address) throw new AppError("Alamat tidak ditemukan", 404);

      const coverage = await tx.providerCoverage.findFirst({
        where: {
          providerId,
          districtId: address.village.district.id,
          deletedAt: null,
        },
      });

      if (!coverage) {
        throw new AppError(
          "Alamat Anda berada di luar jangkauan provider yang dipilih",
          400
        );
      }

      // ---- Mulai perhitungan total harga ----
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

        // Bundle
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
        } else if (item.toppingId) {
          const topping = await tx.providerTopping.findUnique({
            where: { id: item.toppingId },
          });
          if (!topping) throw new AppError("Topping tidak ditemukan", 404);

          const toppingTotal = Number(topping.price) * (item.quantity || 1);
          itemPrice += toppingTotal;

          orderItem = await tx.orderItem.create({
            data: {
              orderId: order.id,
              price: toppingTotal,
            },
          });

          await tx.orderItemTopping.create({
            data: {
              orderItemId: orderItem.id,
              toppingId: topping.id,
              price: topping.price,
              quantity: item.quantity || 1,
            },
          });
        }

        // Tambahan topping
        if (item.toppings && item.toppings.length > 0) {
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

      // Update total
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { totalPrice },
        include: {
          user: { select: { id: true, name: true } },
          provider: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
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
        },
      });

      return { data: formatOrderResponse(updatedOrder, user.name) };
    });
  }

  static async getAllOrder(userId) {
    return await prisma.$transaction(async (tx) => {
      // Validasi user aktif dan terverifikasi
      const user = await tx.user.findFirst({
        where: {
          id: userId,
          isActive: true,
          deletedAt: null,
          isVerified: true,
        },
      });
      if (!user) throw new AppError("Akun belum terverifikasi", 403);

      // Ambil semua order milik user
      const orders = await tx.order.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true } },
          provider: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
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
        },
      });

      // Jika kosong
      if (orders.length === 0) {
        throw new AppError("Belum ada pesanan yang dibuat", 404);
      }

      // Format semua order dengan helper
      const formattedOrders = orders.map((o) => formatOrderResponse(o));

      return { data: formattedOrders };
    });
  }

  static async getOrderById(userId, orderId) {
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

      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          userId,
          deletedAt: null,
        },
        include: {
          user: { select: { id: true, name: true } },
          provider: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
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
        },
      });

      if (!order) {
        throw new AppError("Pesanan tidak ditemukan", 404);
      }

      const formattedOrder = formatOrderResponse(order, user.name);

      return { data: formattedOrder };
    });
  }

  static async getOrdersByUser(userId) {
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

      const orders = await tx.order.findMany({
        where: {
          userId,
          deletedAt: null,
        },
        include: {
          user: { select: { id: true, name: true } },
          provider: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
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
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const formattedOrders = orders.map((order) =>
        formatOrderResponse(order, user.name)
      );

      return { data: formattedOrders };
    });
  }

  static async updateOrderStatus(orderId, status, userId, userRole) {
    // Validasi role
    if (userRole !== "ADMIN" && userRole !== "PROVIDER") {
      throw new AppError(
        "Hanya admin atau provider yang dapat memperbarui status order",
        403
      );
    }

    return await prisma.$transaction(async (tx) => {
      // Cek apakah order valid
      const order = await tx.order.findUnique({
        where: { id: orderId, deletedAt: null },
        include: {
          user: { select: { id: true, name: true } },
          provider: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
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
        },
      });

      if (!order) {
        throw new AppError("Pesanan tidak ditemukan", 404);
      }

      // Validasi status baru
      const validStatuses = [
        "PENDING",
        "PAID",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "EXPIRED",
        "REFUNDED",
      ];

      if (!validStatuses.includes(status)) {
        throw new AppError("Status tidak valid", 400);
      }

      if (order.status === "COMPLETED" && status !== "REFUNDED") {
        throw new AppError(
          "Pesanan yang telah selesai tidak dapat diubah lagi",
          400
        );
      }

      // Update status order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          user: { select: { id: true, name: true } },
          provider: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
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
        },
      });

      // Kirim notifikasi ke customer
      const notif = await tx.notification.create({
        data: {
          userId: order.userId,
          type: "SYSTEM",
          message: `Status pesanan Anda diperbarui menjadi ${status}`,
          isRead: false,
        },
      });

      // Format response agar konsisten
      const formatted = formatOrderResponse(updatedOrder, order.user.name);

      return {
        message: `Status order berhasil diperbarui menjadi ${status}`,
        data: formatted,
        notification: notif,
      };
    });
  }
}

module.exports = OrderService;
