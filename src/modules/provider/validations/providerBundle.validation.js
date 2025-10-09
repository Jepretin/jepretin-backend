const Joi = require("joi");

class ProviderBundleValidation {
  static createBundle = Joi.object({
    name: Joi.string().trim().min(3).max(100).required().messages({
      "string.empty": "Nama bundle wajib diisi",
      "string.min": "Nama bundle minimal 3 karakter",
      "any.required": "Nama bundle wajib diisi",
    }),
    description: Joi.string().allow("", null).max(500),
    price: Joi.number().positive().required().messages({
      "number.base": "Harga harus berupa angka",
      "number.positive": "Harga harus lebih dari 0",
      "any.required": "Harga wajib diisi",
    }),
  });

  static updateBundle = Joi.object({
    name: Joi.string().trim().min(3).max(100),
    description: Joi.string().allow("", null).max(500),
    price: Joi.number().positive(),
  }).min(1);
}

module.exports = ProviderBundleValidation;
