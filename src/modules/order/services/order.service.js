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

      // ✅ CEK JANGKAUAN PROVIDER
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
        }

        // Standalone topping
        else if (item.toppingId) {
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
}

module.exports = OrderService;
