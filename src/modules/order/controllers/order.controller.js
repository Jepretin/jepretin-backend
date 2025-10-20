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

  static getAllOrder = handleAsync(async (req, res) => {
    const order = await OrderService.getAllOrder();
    return success(res, 200, "Daftar Order berhasil diambil.", order);
  });
}

module.exports = OrderController;
