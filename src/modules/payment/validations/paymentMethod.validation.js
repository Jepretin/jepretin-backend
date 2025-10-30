const Joi = require("joi");

class PaymentMethodValidation {
  static createPaymentMethod = Joi.object({
    name: Joi.string()
      .pattern(/^[A-Za-z\s]+$/)
      .min(2)
      .required()
      .messages({
        "string.base": "Nama harus berupa teks",
        "string.empty": "Nama tidak boleh kosong",
        "string.min": "Nama minimal {#limit} karakter",
        "string.pattern.base": "Nama hanya boleh mengandung huruf dan spasi",
      }),
    provider: Joi.string()
      .pattern(/^[A-Za-z\s]+$/)
      .min(2)
      .required()
      .messages({
        "string.base": "Provider harus berupa teks",
        "string.empty": "Provider tidak boleh kosong",
        "string.min": "Provider minimal {#limit} karakter",
        "string.pattern.base":
          "Provider hanya boleh mengandung huruf dan spasi",
      }),
    categoryId: Joi.string().uuid().required().messages({
      "string.guid": "Kategori ID harus berupa UUID yang valid",
    }),
  });
}

module.exports = PaymentMethodValidation;
