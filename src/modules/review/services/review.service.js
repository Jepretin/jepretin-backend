const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class ReviewService {
  static async createReview({ userId, orderId, rating, comment }) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { provider: true },
      });

      if (!order || order.deletedAt) {
        throw new AppError("Order tidak ditemukan", 404);
      }

      if (order.userId !== userId) {
        throw new AppError("Anda bukan pemilik order ini", 403);
      }

      if (order.status !== "COMPLETED") {
        throw new AppError(
          "Review hanya dapat diberikan setelah order selesai",
          400
        );
      }

      const existingReview = await tx.review.findUnique({
        where: { orderId },
      });

      if (existingReview) {
        throw new AppError(
          "Review untuk order ini sudah ada",
          400
        );
      }

      const review = await tx.review.create({
        data: {
          orderId,
          userId,
          providerId: order.providerId,
          rating,
          comment: comment || null,
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          provider: {
            select: {
              id: true,
              user: { select: { name: true } },
            },
          },
          order: { select: { id: true, status: true } },
        },
      });

      await tx.notification.create({
        data: {
          userId: order.provider.userId,
          orderId,
          type: "ORDER_STATUS",
          message: `Pelanggan memberikan rating ${rating} bintang untuk order Anda`,
          isRead: false,
        },
      });

      return {
        message: "Review berhasil dibuat",
        data: {
          id: review.id,
          orderId: review.orderId,
          rating: review.rating,
          comment: review.comment,
          customerName: review.user.name,
          customerAvatar: review.user.avatar,
          providerName: review.provider.user.name,
          createdAt: review.createdAt,
        },
      };
    });
  }

  static async getMyReviews(userId) {
    const reviews = await prisma.review.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        provider: {
          select: {
            id: true,
            user: { select: { name: true, avatar: true } },
          },
        },
        order: { select: { id: true, status: true, eventDateTime: true } },
      },
    });

    if (!reviews.length) {
      throw new AppError("Belum ada review yang diberikan", 404);
    }

    return {
      total: reviews.length,
      data: reviews.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        orderStatus: r.order.status,
        eventDateTime: r.order.eventDateTime,
        rating: r.rating,
        comment: r.comment,
        providerId: r.provider.id,
        providerName: r.provider.user.name,
        providerAvatar: r.provider.user.avatar,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  static async getProviderReviews(userId) {
    const provider = await prisma.provider.findUnique({
      where: { userId },
    });
    if (!provider) throw new AppError("Provider tidak ditemukan", 404);

    const reviews = await prisma.review.findMany({
      where: { providerId: provider.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        order: { select: { id: true, status: true, eventDateTime: true } },
      },
    });

    if (!reviews.length) {
      throw new AppError("Belum ada review untuk provider ini", 404);
    }

    const averageRating = reviews.length
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

    return {
      total: reviews.length,
      averageRating: Number(averageRating),
      data: reviews.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        orderStatus: r.order.status,
        eventDateTime: r.order.eventDateTime,
        rating: r.rating,
        comment: r.comment,
        customerName: r.user.name,
        customerAvatar: r.user.avatar,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    };
  }

  static async getReviewsByProviderId(providerId) {
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    });
    if (!provider) throw new AppError("Provider tidak ditemukan", 404);

    const reviews = await prisma.review.findMany({
      where: { providerId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        order: { select: { id: true, eventDateTime: true } },
      },
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews
      ? Number(
          (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        )
      : 0;

    return {
      providerId: provider.id,
      providerName: provider.user.name,
      providerAvatar: provider.user.avatar,
      totalReviews,
      averageRating,
      data: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        customerName: r.user.name,
        customerAvatar: r.user.avatar,
        eventDateTime: r.order.eventDateTime,
        createdAt: r.createdAt,
      })),
    };
  }

  static async getReviewById(userId, reviewId) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        provider: {
          select: {
            id: true,
            user: { select: { name: true, avatar: true } },
          },
        },
        order: { select: { id: true, status: true, eventDateTime: true } },
      },
    });

    if (!review) throw new AppError("Review tidak ditemukan", 404);

    const provider = await prisma.provider.findUnique({
      where: { userId },
    });

    const isOwner = review.userId === userId;
    const isProvider = provider && review.providerId === provider.id;

    if (!isOwner && !isProvider && userId !== review.userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user?.role !== "ADMIN") {
        throw new AppError("Anda tidak memiliki akses ke review ini", 403);
      }
    }

    return {
      data: {
        id: review.id,
        orderId: review.orderId,
        orderStatus: review.order.status,
        eventDateTime: review.order.eventDateTime,
        rating: review.rating,
        comment: review.comment,
        customer: {
          id: review.user.id,
          name: review.user.name,
          avatar: review.user.avatar,
        },
        provider: {
          id: review.provider.id,
          name: review.provider.user.name,
          avatar: review.provider.user.avatar,
        },
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      },
    };
  }

  static async updateReview({ userId, reviewId, rating, comment }) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });

    if (!review) throw new AppError("Review tidak ditemukan", 404);

    if (review.userId !== userId) {
      throw new AppError("Anda tidak berhak mengubah review ini", 403);
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: rating ?? review.rating,
        comment: comment !== undefined ? comment : review.comment,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        provider: {
          select: {
            id: true,
            user: { select: { name: true } },
          },
        },
      },
    });

    return {
      message: "Review berhasil diperbarui",
      data: {
        id: updated.id,
        orderId: updated.orderId,
        rating: updated.rating,
        comment: updated.comment,
        customerName: updated.user.name,
        providerName: updated.provider.user.name,
        updatedAt: updated.updatedAt,
      },
    };
  }

  static async deleteReview(userId, reviewId) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, deletedAt: null },
    });

    if (!review) throw new AppError("Review tidak ditemukan", 404);

    if (review.userId !== userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (user?.role !== "ADMIN") {
        throw new AppError("Anda tidak berhak menghapus review ini", 403);
      }
    }

    await prisma.review.update({
      where: { id: reviewId },
      data: { deletedAt: new Date() },
    });

    return { message: "Review berhasil dihapus" };
  }
}

module.exports = ReviewService;
