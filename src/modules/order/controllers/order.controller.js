const OrderService = require("../services/order.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class OrderController {
  static addOrder = handleAsync(async (req, res) => {
    const { providerId, addressId, eventDateTime, items } = req.body;
    const userId = req.user.id;

    const order = await OrderService.addOrder({
      userId,
      providerId,
      addressId,
      eventDateTime,
      items,
    });

    return success(res, 201, "Order berhasil dibuat.", order);
  });
}

module.exports = OrderController;
