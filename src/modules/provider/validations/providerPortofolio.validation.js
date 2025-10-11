const Joi = require("joi");

class PortofolioValidation {
  static createPortofolio = Joi.object({
    mediaType: Joi.string().valid("image", "video").required().messages({
      "any.required": "Media type wajib diisi",
      "any.only": "Media type hanya bisa 'image' atau 'video'",
    }),
    description: Joi.string().allow("").max(255).messages({
      "string.max": "Deskripsi maksimal 255 karakter",
    }),
  });

  static updatePortofolio = Joi.object({
    mediaType: Joi.string().valid("image", "video").optional().messages({
      "any.only": "Media type hanya bisa 'image' atau 'video'",
    }),
    description: Joi.string().allow("").max(255).messages({
      "string.max": "Deskripsi maksimal 255 karakter",
    }),
  });
}

module.exports = PortofolioValidation;
