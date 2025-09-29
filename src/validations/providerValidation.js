const Joi = require("joi");

class ProviderValidation {
  // Register provider
  static register() {
    return Joi.object({
      experience: Joi.string().uri().required().messages({
        "string.base": "Experience harus berupa string",
        "string.uri":
          "Experience harus berupa link yang valid (contoh: Google Drive, ImageKit, dll).",
        "any.required": "Experience wajib diisi",
      }),
      roles: Joi.array().items(Joi.string().uuid()).min(1).messages({
        "array.base": "Role harus berupa array",
        "string.guid": "Role ID harus berupa UUID yang valid",
        "array.min": "Minimal pilih 1 role",
      }),
    });
  }

  // Update hanya experience (dipakai provider jika REJECTED)
  static updateExperience() {
    return Joi.object({
      experience: Joi.string().uri().required().messages({
        "string.base": "Experience harus berupa string",
        "string.uri":
          "Experience harus berupa link yang valid (contoh: Google Drive, ImageKit, dll).",
        "any.required": "Experience wajib diisi",
      }),
    });
  }

  // Update status (khusus admin)
  static updateStatus() {
    return Joi.object({
      status: Joi.string()
        .valid("PENDING", "ACCEPTED", "REJECTED")
        .required()
        .messages({
          "any.only":
            "Status tidak valid. Hanya diperbolehkan: PENDING, ACCEPTED, REJECTED",
          "any.required": "Status wajib diisi",
        }),
    });
  }
}

module.exports = ProviderValidation;
