const Joi = require("joi");

class WalletValidation {
  static updateBalance = Joi.object({
    walletId: Joi.string().uuid().required().messages({
      "string.guid": "Wallet ID harus berupa UUID yang valid",
      "any.required": "Wallet ID wajib diisi",
    }),

    amount: Joi.number().positive().required().messages({
      "number.base": "Jumlah saldo harus berupa angka",
      "number.positive": "Jumlah saldo harus lebih besar dari 0",
      "any.required": "Jumlah saldo wajib diisi",
    }),

    type: Joi.string().valid("CREDIT", "DEBIT").required().messages({
      "any.only": "Tipe transaksi harus berupa CREDIT atau DEBIT",
      "any.required": "Tipe transaksi wajib diisi",
    }),

    orderId: Joi.string().uuid().optional().allow(null).messages({
      "string.guid": "Order ID harus berupa UUID yang valid",
    }),

    description: Joi.string().max(255).optional().allow(null, "").messages({
      "string.max": "Deskripsi maksimal {#limit} karakter",
    }),
  });
}

module.exports = WalletValidation;
