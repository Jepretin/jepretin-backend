const ReviewService = require("../services/review.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class ReviewController {
  static createReview = handleAsync(async (req, res) => {
    const { orderId, rating, comment } = req.body;
    const userId = req.user.id;

    const result = await ReviewService.createReview({
      userId,
      orderId,
      rating,
      comment,
    });

    return success(res, 201, result.message, result.data);
  });

  static getMyReviews = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await ReviewService.getMyReviews(userId);
    return success(res, 200, "Review berhasil diambil", result);
  });

  static getProviderReviews = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await ReviewService.getProviderReviews(userId);
    return success(res, 200, "Review provider berhasil diambil", result);
  });

  static getReviewsByProviderId = handleAsync(async (req, res) => {
    const { providerId } = req.params;
    const result = await ReviewService.getReviewsByProviderId(providerId);
    return success(res, 200, "Review provider berhasil diambil", result);
  });

  static getReviewById = handleAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await ReviewService.getReviewById(userId, id);
    return success(res, 200, "Detail review berhasil diambil", result);
  });

  static updateReview = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const result = await ReviewService.updateReview({
      userId,
      reviewId: id,
      rating,
      comment,
    });

    return success(res, 200, result.message, result.data);
  });

  static deleteReview = handleAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await ReviewService.deleteReview(userId, id);
    return success(res, 200, result.message);
  });
}

module.exports = ReviewController;
