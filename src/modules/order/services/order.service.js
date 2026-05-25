const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const { formatOrderResponse } = require("../helpers/order.helper");

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

      const unavailable = await tx.providerAvailability.findFirst({
        where: {
          providerId,
          isAvailable: false,
          deletedAt: null,
          startDate: { lte: new Date(eventDateTime) },
          endDate: { gte: new Date(eventDateTime) },
        },
      });

      if (unavailable) {
        throw new AppError(
          "Provider tidak tersedia pada tanggal yang dipilih",
          400
        );
      }

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

      return { data: formatOrderResponse(updatedOrder) };
    });
  }

  static async getAllOrder() {
    const orders = await prisma.order.findMany({
      where: { deletedAt: null },
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

    const formattedOrders = orders.map((o) => formatOrderResponse(o));

    return { total: formattedOrders.length, data: formattedOrders };
  }

  static async getOrderById(userId, orderId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AppError("User tidak ditemukan", 404);

    const order = await prisma.order.findFirst({
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

    if (!order) throw new AppError("Order tidak ditemukan", 404);

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    const isOwner = order.userId === userId;
    const isProvider = provider && order.providerId === provider.id;

    if (!isOwner && !isProvider && user.role !== "ADMIN") {
      throw new AppError("Anda tidak memiliki akses ke order ini", 403);
    }

    return { data: formatOrderResponse(order) };
  }

  static async getMyOrders(userId) {
    const orders = await prisma.order.findMany({
      where: { userId, deletedAt: null },
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

    const formattedOrders = orders.map((o) => formatOrderResponse(o));

    return { total: formattedOrders.length, data: formattedOrders };
  }

  static async getProviderOrders(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });
    if (!provider) throw new AppError("Provider tidak ditemukan", 404);

    const orders = await prisma.order.findMany({
      where: { providerId: provider.id, deletedAt: null },
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

    const formattedOrders = orders.map((o) => formatOrderResponse(o));

    return { total: formattedOrders.length, data: formattedOrders };
  }

  static async updateOrderStatus(orderId, status, userId, userRole) {
    const TRANSITIONS = {
      CUSTOMER: {
        PENDING: ["CANCELLED"],
        WAITING_CONFIRMATION: ["COMPLETED"],
      },
      PROVIDER: {
        PAID: ["IN_PROGRESS"],
        IN_PROGRESS: ["WAITING_CONFIRMATION"],
      },
    };

    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId, deletedAt: null },
        include: {
          provider: { select: { id: true, userId: true } },
        },
      });

      if (!order) throw new AppError("Order tidak ditemukan", 404);

      if (userRole !== "ADMIN") {
        const provider = await tx.provider.findUnique({
          where: { userId },
        });

        const isOwner = order.userId === userId;
        const isProvider =
          provider && order.providerId === provider.id;

        if (!isOwner && !isProvider) {
          throw new AppError("Anda tidak memiliki akses ke order ini", 403);
        }

        const effectiveRole = isProvider ? "PROVIDER" : "CUSTOMER";
        const currentStatus = order.status;
        const allowedStatuses =
          TRANSITIONS[effectiveRole]?.[currentStatus];

        if (!allowedStatuses || !allowedStatuses.includes(status)) {
          throw new AppError(
            `Status tidak dapat diubah dari ${currentStatus} ke ${status}`,
            400
          );
        }

        if (effectiveRole === "CUSTOMER" && !isOwner) {
          throw new AppError(
            "Anda tidak memiliki akses ke order ini",
            403
          );
        }
      }

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
          orderItems: {
            include: {
              bundle: true,
              orderItemToppings: { include: { topping: true } },
            },
          },
        },
      });

      const statusMessages = {
        IN_PROGRESS: "Pesanan sedang dikerjakan oleh provider",
        WAITING_CONFIRMATION:
          "Provider telah menyelesaikan pekerjaan, menunggu konfirmasi Anda",
        COMPLETED: "Pesanan telah selesai",
        CANCELLED: "Pesanan dibatalkan",
      };

      const message =
        statusMessages[status] ||
        `Status pesanan diperbarui menjadi ${status}`;

      await tx.notification.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          type: "ORDER_STATUS",
          message,
          isRead: false,
        },
      });

      if (status === "COMPLETED") {
        const wallet = await tx.wallet.findFirst({
          where: { providerId: order.providerId, deletedAt: null },
        });

        if (wallet) {
          const payment = await tx.payment.findFirst({
            where: { orderId: order.id, status: "SUCCESS", deletedAt: null },
          });

          if (payment) {
            const creditAmount = Number(
              payment.netAmount || payment.amount
            );
            const newBalance =
              Number(wallet.currentBalance) + creditAmount;

            await tx.wallet.update({
              where: { id: wallet.id },
              data: { currentBalance: newBalance },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                orderId: order.id,
                paymentId: payment.id,
                amount: creditAmount,
                type: "CREDIT",
                status: "SUCCESS",
                description: `Pembayaran order ${order.id} dikreditkan`,
              },
            });
          }
        }
      }

      return {
        message,
        data: formatOrderResponse(updatedOrder),
      };
    });
  }
}

module.exports = OrderService;
