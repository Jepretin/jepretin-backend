function formatOrderSummary(order) {
  if (!order) return null;

  return {
    id: order.id,
    provider: {
      id: order.provider?.id,
      name: order.provider?.user?.name || null,
    },
    status: order.status,
    totalPrice: Number(order.totalPrice),
    eventDateTime: order.eventDateTime,
    createdAt: order.createdAt,
  };
}

function formatOrderDetail(order) {
  if (!order) return null;

  return {
    id: order.id,
    user: {
      id: order.user?.id,
      name: order.user?.name || null,
    },
    provider: {
      id: order.provider?.id,
      name: order.provider?.user?.name || null,
    },
    address: order.customerAddress
      ? {
          id: order.customerAddress.id,
          detail: order.customerAddress.addressDetail,
          village: order.customerAddress.village?.name,
          district: order.customerAddress.village?.district?.name,
          regency: order.customerAddress.village?.district?.regency?.name,
          province:
            order.customerAddress.village?.district?.regency?.province?.name,
        }
      : null,
    eventDateTime: order.eventDateTime,
    status: order.status,
    totalPrice: Number(order.totalPrice),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: order.orderItems?.map((item) => ({
      id: item.id,
      bundle: item.bundle
        ? {
            id: item.bundle.id,
            name: item.bundle.name,
            price: Number(item.bundle.price),
          }
        : null,
      price: Number(item.price),
      toppings:
        item.orderItemToppings?.map((t) => ({
          id: t.topping.id,
          name: t.topping.name,
          price: Number(t.price),
          quantity: t.quantity,
        })) || [],
    })),
  };
}

module.exports = { formatOrderSummary, formatOrderDetail };
