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

  static getOrderById = handleAsync(async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    const data = await OrderService.getOrderById(userId, orderId);
    return success(res, 200, "Data Order berhasil diambil.", data);
  });

  static getUserOrders = handleAsync(async (req, res) => {
    const userId = req.user.id;

    const result = await OrderService.getOrdersByUser(userId);

    return success(res, 200, "Daftar pesanan berhasil diambil", result);
  });

  static updateOrderStatus = handleAsync(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const result = await OrderService.updateOrderStatus(
      orderId,
      status,
      userId,
      userRole
    );

    return success(res, 200, result.message, result);
  });
}

module.exports = OrderController;
