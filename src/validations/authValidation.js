const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z\s]+$/)
    .min(3)
    .required()
    .messages({
      "string.base": "Nama harus berupa teks",
      "string.empty": "Nama tidak boleh kosong",
      "string.min": "Nama minimal {#limit} karakter",
      "string.pattern.base": "Nama hanya boleh mengandung huruf dan spasi",
      "any.required": "Nama wajib diisi",
    }),
  email: Joi.string().email().required().messages({
    "string.email": "Email tidak valid",
    "any.required": "Email wajib diisi",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password minimal {#limit} karakter",
    "any.required": "Password wajib diisi",
  }),
  phone: Joi.string().optional(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Token reset password wajib ada",
  }),
  newPassword: Joi.string().min(6).required().messages({
    "string.min": "Password baru minimal {#limit} karakter",
    "any.required": "Password baru wajib diisi",
  }),
});

module.exports = {
  registerSchema,
  resetPasswordSchema,
};
