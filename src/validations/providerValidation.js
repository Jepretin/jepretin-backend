const Joi = require("joi");

const providerValidation = Joi.object({
  experience: Joi.string().uri().required().messages({
    "string.base": "Experience harus berupa string",
    "string.uri":
      "Experience harus berupa link yang valid (contoh: Google Drive, ImageKit, dll).",
    "any.required": "Experience wajib diisi",
  }),

  bankName: Joi.string().required().messages({
    "any.required": "Nama bank wajib diisi",
  }),

  bankAccountNumber: Joi.string()
    .pattern(/^\d+$/) // hanya angka
    .min(6) // minimal 6 digit
    .required()
    .messages({
      "string.pattern.base": "Nomor rekening hanya boleh berisi angka",
      "string.min": "Nomor rekening minimal 6 digit",
      "any.required": "Nomor rekening wajib diisi",
    }),

  bankAccountName: Joi.string().required().messages({
    "any.required": "Nama pemilik rekening wajib diisi",
  }),
});

module.exports = providerValidation;
