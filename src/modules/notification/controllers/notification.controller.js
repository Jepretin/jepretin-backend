const NotificationService = require("../services/notification.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class NotificationController {
  static getNotifications = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await NotificationService.getNotifications(userId, {
      page,
      limit,
    });

    return success(res, 200, "Notifikasi berhasil diambil", result);
  });

  static getUnreadCount = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await NotificationService.getUnreadCount(userId);
    return success(res, 200, "Jumlah notifikasi belum dibaca", result);
  });

  static markAsRead = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await NotificationService.markAsRead(userId, id);
    return success(res, 200, result.message);
  });

  static markAllAsRead = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await NotificationService.markAllAsRead(userId);
    return success(res, 200, result.message, result);
  });
}

module.exports = NotificationController;
