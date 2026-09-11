const Joi = require("joi");

class UserValidation {
  static updateUser = Joi.object({
    name: Joi.string()
      .pattern(/^[A-Za-z\s]+$/)
      .min(3)
      .max(100)
      .optional()
      .messages({
        "string.base": "Nama harus berupa teks",
        "string.empty": "Nama tidak boleh kosong",
        "string.min": "Nama minimal {#limit} karakter",
        "string.max": "Nama maksimal {#limit} karakter",
        "string.pattern.base": "Nama hanya boleh mengandung huruf dan spasi",
      }),
    email: Joi.string().email().max(100).optional().messages({
      "string.email": "Email tidak valid",
      "string.max": "Email maksimal {#limit} karakter",
    }),
    phone: Joi.string().max(20).optional().messages({
      "string.max": "Nomor telepon maksimal {#limit} karakter",
    }),
    avatar: Joi.string().uri().max(500).optional().messages({
      "string.uri": "Avatar harus berupa URL yang valid",
      "string.max": "URL Avatar maksimal {#limit} karakter",
    }),
    password: Joi.string().min(6).max(50).optional().messages({
      "string.min": "Password minimal {#limit} karakter",
      "string.max": "Password maksimal {#limit} karakter",
    }),
    confirmPassword: Joi.when("password", {
      is: Joi.exist(),
      then: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Konfirmasi password tidak cocok",
        "any.required": "Konfirmasi password wajib diisi jika password diubah",
      }),
      otherwise: Joi.forbidden(),
    }),
  });
}

module.exports = UserValidation;
