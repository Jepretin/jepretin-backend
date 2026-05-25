const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class NotificationService {
  static async getNotifications(userId, { page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          order: { select: { id: true, status: true } },
          template: { select: { title: true } },
        },
      }),
      prisma.notification.count({
        where: { userId, deletedAt: null },
      }),
    ]);

    if (!notifications.length) {
      return {
        total: 0,
        unreadCount: 0,
        page,
        limit,
        data: [],
      };
    }

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null },
    });

    return {
      total,
      unreadCount,
      page,
      limit,
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        orderId: n.order?.id || null,
        orderStatus: n.order?.status || null,
        templateTitle: n.template?.title || null,
        createdAt: n.createdAt,
      })),
    };
  }

  static async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null },
    });

    return { unreadCount: count };
  }

  static async markAsRead(userId, notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId, deletedAt: null },
    });

    if (!notification) {
      throw new AppError("Notifikasi tidak ditemukan", 404);
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { message: "Notifikasi ditandai sudah dibaca" };
  }

  static async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true },
    });

    return {
      message: `${result.count} notifikasi ditandai sudah dibaca`,
      updatedCount: result.count,
    };
  }
}

module.exports = NotificationService;
