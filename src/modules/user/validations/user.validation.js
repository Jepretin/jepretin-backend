const Joi = require("joi");

class UserValidation {
  static updateUser = Joi.object({
    name: Joi.string()
      .pattern(/^[A-Za-z\s]+$/)
      .min(3)
      .optional()
      .messages({
        "string.base": "Nama harus berupa teks",
        "string.empty": "Nama tidak boleh kosong",
        "string.min": "Nama minimal {#limit} karakter",
        "string.pattern.base": "Nama hanya boleh mengandung huruf dan spasi",
      }),
    email: Joi.string().email().optional().messages({
      "string.email": "Email tidak valid",
    }),
    phone: Joi.string().optional(),
    avatar: Joi.string().uri().optional().messages({
      "string.uri": "Avatar harus berupa URL yang valid",
    }),
    password: Joi.string().min(6).optional().messages({
      "string.min": "Password minimal {#limit} karakter",
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
