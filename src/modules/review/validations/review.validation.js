const Joi = require("joi");

class ReviewValidation {
  static createReview = Joi.object({
    orderId: Joi.string().uuid().required().messages({
      "string.guid": "Order ID harus berupa UUID yang valid",
      "any.required": "Order ID wajib diisi",
    }),

    rating: Joi.number().integer().min(1).max(5).required().messages({
      "number.base": "Rating harus berupa angka",
      "number.min": "Rating minimal 1",
      "number.max": "Rating maksimal 5",
      "any.required": "Rating wajib diisi",
    }),

    comment: Joi.string().trim().max(500).optional().allow(null, "").messages({
      "string.max": "Komentar maksimal {#limit} karakter",
    }),
  });

  static updateReview = Joi.object({
    rating: Joi.number().integer().min(1).max(5).optional().messages({
      "number.base": "Rating harus berupa angka",
      "number.min": "Rating minimal 1",
      "number.max": "Rating maksimal 5",
    }),

    comment: Joi.string().trim().max(500).optional().allow(null, "").messages({
      "string.max": "Komentar maksimal {#limit} karakter",
    }),
  });
}

module.exports = ReviewValidation;
