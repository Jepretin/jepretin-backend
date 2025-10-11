const Joi = require("joi");

class UserAddressValidation {
  static createAddress = Joi.object({
    villageId: Joi.string().required().messages({
      "any.required": "Village ID wajib diisi.",
    }),

    addressDetail: Joi.string().min(5).max(255).required().messages({
      "string.empty": "Detail alamat wajib diisi.",
      "string.min": "Detail alamat minimal 5 karakter.",
      "string.max": "Detail alamat maksimal 255 karakter.",
    }),

    isPrimary: Joi.boolean().default(false).messages({
      "boolean.base": "isPrimary harus berupa nilai boolean (true/false).",
    }),
  });
}

module.exports = UserAddressValidation;
