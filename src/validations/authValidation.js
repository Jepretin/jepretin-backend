const Joi = require("joi");

class AuthValidation {
  static register = Joi.object({
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

  static resetPassword = Joi.object({
    token: Joi.string().required().messages({
      "any.required": "Token reset password wajib ada",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password minimal {#limit} karakter",
      "any.required": "Password wajib diisi",
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Konfirmasi password tidak cocok",
        "any.required": "Konfirmasi password wajib diisi",
      }),
  });

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

module.exports = AuthValidation;
