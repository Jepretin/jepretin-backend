const Joi = require("joi");

class ProviderToppingValidation {
  static createTopping = Joi.object({
    name: Joi.string().trim().min(3).max(100).required().messages({
      "string.empty": "Nama topping wajib diisi.",
      "string.min": "Nama topping minimal 3 karakter.",
      "string.max": "Nama topping maksimal 100 karakter.",
    }),
    description: Joi.string().trim().allow(null, "").max(255).messages({
      "string.max": "Deskripsi maksimal 255 karakter.",
    }),
    price: Joi.number().min(0).required().messages({
      "number.base": "Harga harus berupa angka.",
      "number.min": "Harga tidak boleh bernilai negatif.",
      "any.required": "Harga wajib diisi.",
    }),
    isStandalone: Joi.boolean().required().messages({
      "any.required": "Status standalone wajib diisi (true/false).",
    }),
    bundleId: Joi.when("isStandalone", {
      is: false,
      then: Joi.string().required().messages({
        "any.required": "Bundle ID wajib diisi jika topping bukan standalone.",
      }),
      otherwise: Joi.forbidden(),
    }),
  });

  static updateTopping = Joi.object({
    name: Joi.string().trim().min(3).max(100).optional().messages({
      "string.min": "Nama topping minimal 3 karakter.",
      "string.max": "Nama topping maksimal 100 karakter.",
    }),
    description: Joi.string()
      .trim()
      .allow(null, "")
      .max(255)
      .optional()
      .messages({
        "string.max": "Deskripsi maksimal 255 karakter.",
      }),
    price: Joi.number().min(0).optional().messages({
      "number.base": "Harga harus berupa angka.",
      "number.min": "Harga tidak boleh bernilai negatif.",
    }),
    isStandalone: Joi.boolean().optional(),
    bundleId: Joi.when("isStandalone", {
      is: false,
      then: Joi.string().required().messages({
        "any.required": "Bundle ID wajib diisi jika topping bukan standalone.",
      }),
      otherwise: Joi.forbidden(),
    }),
  });
}

module.exports = ProviderToppingValidation;
