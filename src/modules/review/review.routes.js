const express = require("express");
const ReviewController = require("./controllers/review.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");
const ReviewValidation = require("./validations/review.validation");

const router = express.Router();

router.post(
  "/review",
  authMiddleware.authenticate,
  validate(ReviewValidation.createReview),
  ReviewController.createReview
);

router.get(
  "/my-reviews",
  authMiddleware.authenticate,
  ReviewController.getMyReviews
);

router.get(
  "/provider-reviews",
  authMiddleware.authenticate,
  ReviewController.getProviderReviews
);

router.get(
  "/provider/:providerId",
  authMiddleware.authenticate,
  ReviewController.getReviewsByProviderId
);

router.get(
  "/:id",
  authMiddleware.authenticate,
  ReviewController.getReviewById
);

router.put(
  "/:id",
  authMiddleware.authenticate,
  validate(ReviewValidation.updateReview),
  ReviewController.updateReview
);

router.delete(
  "/:id",
  authMiddleware.authenticate,
  ReviewController.deleteReview
);

module.exports = router;
