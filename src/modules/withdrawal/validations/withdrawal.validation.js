const Joi = require("joi");

class WithdrawalValidation {
  static requestWithdrawal = Joi.object({
    amount: Joi.number().integer().min(10000).required().messages({
      "number.base": "Jumlah penarikan harus berupa angka",
      "number.min": "Minimal penarikan Rp10.000",
      "any.required": "Jumlah penarikan wajib diisi",
    }),

    bankName: Joi.string().trim().min(2).max(100).required().messages({
      "string.base": "Nama bank harus berupa teks",
      "string.min": "Nama bank minimal {#limit} karakter",
      "string.max": "Nama bank maksimal {#limit} karakter",
      "any.required": "Nama bank wajib diisi",
    }),

    bankAccountNumber: Joi.string()
      .trim()
      .pattern(/^[0-9]+$/)
      .min(5)
      .max(30)
      .required()
      .messages({
        "string.base": "Nomor rekening harus berupa teks",
        "string.pattern.base": "Nomor rekening hanya boleh berisi angka",
        "string.min": "Nomor rekening minimal {#limit} digit",
        "string.max": "Nomor rekening maksimal {#limit} digit",
        "any.required": "Nomor rekening wajib diisi",
      }),

    bankAccountName: Joi.string().trim().min(2).max(150).required().messages({
      "string.base": "Nama pemilik rekening harus berupa teks",
      "string.min": "Nama pemilik rekening minimal {#limit} karakter",
      "string.max": "Nama pemilik rekening maksimal {#limit} karakter",
      "any.required": "Nama pemilik rekening wajib diisi",
    }),
  });

  static approveWithdrawal = Joi.object({
    note: Joi.string().trim().max(255).optional().allow(null, "").messages({
      "string.max": "Catatan maksimal {#limit} karakter",
    }),
  });

  static rejectWithdrawal = Joi.object({
    note: Joi.string().trim().max(255).required().messages({
      "string.base": "Catatan harus berupa teks",
      "string.max": "Catatan maksimal {#limit} karakter",
      "any.required": "Catatan penolakan wajib diisi",
    }),
  });
}

module.exports = WithdrawalValidation;
