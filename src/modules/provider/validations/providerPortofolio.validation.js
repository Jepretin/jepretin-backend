const Joi = require("joi");

class PortofolioValidation {
  static createPortofolio = Joi.object({
    mediaUrl: Joi.string().uri().required().messages({
      "any.required": "Media URL wajib diisi",
      "string.uri": "Media URL harus berupa link yang valid",
    }),
    mediaId: Joi.string().required().messages({
      "any.required": "Media ID wajib diisi",
    }),
    mediaType: Joi.string().valid("image", "video").required().messages({
      "any.required": "Media type wajib diisi",
      "any.only": "Media type hanya bisa 'image' atau 'video'",
    }),
    description: Joi.string().allow("").max(255).messages({
      "string.max": "Deskripsi maksimal 255 karakter",
    }),
  });
}

module.exports = PortofolioValidation;
