const Joi = require("joi");

class PortofolioValidation {
  static createPortofolio() {
    return Joi.object({
      mediaType: Joi.string().valid("image", "video").required().messages({
        "any.required": "Media type wajib diisi",
        "any.only": "Media type hanya bisa 'image' atau 'video'",
      }),
      description: Joi.string().allow("").max(255).messages({
        "string.max": "Deskripsi maksimal 255 karakter",
      }),
    });
  }
}

module.exports = PortofolioValidation;
