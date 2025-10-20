const Joi = require("joi");

class OrderValidation {
  static createOrder = Joi.object({
    providerId: Joi.string().uuid().required().messages({
      "any.required": "Provider wajib diisi",
      "string.uuid": "Format providerId tidak valid",
    }),

    addressId: Joi.string().uuid().required().messages({
      "any.required": "Alamat wajib diisi",
      "string.uuid": "Format addressId tidak valid",
    }),

    eventDateTime: Joi.date().greater("now").required().messages({
      "any.required": "Tanggal acara wajib diisi",
      "date.greater": "Tanggal acara tidak boleh di masa lalu",
    }),

    items: Joi.array()
      .items(
        Joi.object({
          bundleId: Joi.string().uuid().optional(),
          toppingId: Joi.string().uuid().optional(),
          quantity: Joi.number().integer().min(1).default(1),
          toppings: Joi.array()
            .items(
              Joi.object({
                toppingId: Joi.string().uuid().required(),
                quantity: Joi.number().integer().min(1).default(1),
              })
            )
            .optional(),
        })
      )
      .min(1)
      .required()
      .messages({
        "array.base": "Items harus berupa array",
        "array.min": "Minimal harus ada 1 item order",
        "any.required": "Items wajib diisi",
      }),
  });
}

module.exports = OrderValidation;
