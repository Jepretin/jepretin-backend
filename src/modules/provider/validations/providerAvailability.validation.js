const Joi = require("joi");

class ProviderAvailabilityValidation {
  static createAvailability = Joi.object({
    startDate: Joi.date().iso().greater("now").required().messages({
      "date.base": "Tanggal mulai harus berupa tanggal yang valid",
      "date.format": "Format tanggal harus ISO (YYYY-MM-DD)",
      "date.greater": "Tanggal mulai harus setelah hari ini",
      "any.required": "Tanggal mulai wajib diisi",
    }),

    endDate: Joi.date().iso().greater(Joi.ref("startDate")).required().messages({
      "date.base": "Tanggal selesai harus berupa tanggal yang valid",
      "date.format": "Format tanggal harus ISO (YYYY-MM-DD)",
      "date.greater": "Tanggal selesai harus setelah tanggal mulai",
      "any.required": "Tanggal selesai wajib diisi",
    }),

    isAvailable: Joi.boolean().default(true).messages({
      "boolean.base": "isAvailable harus berupa boolean",
    }),
  });

  static updateAvailability = Joi.object({
    startDate: Joi.date().iso().greater("now").messages({
      "date.base": "Tanggal mulai harus berupa tanggal yang valid",
      "date.format": "Format tanggal harus ISO (YYYY-MM-DD)",
      "date.greater": "Tanggal mulai harus setelah hari ini",
    }),

    endDate: Joi.date().iso().messages({
      "date.base": "Tanggal selesai harus berupa tanggal yang valid",
      "date.format": "Format tanggal harus ISO (YYYY-MM-DD)",
    }),

    isAvailable: Joi.boolean().messages({
      "boolean.base": "isAvailable harus berupa boolean",
    }),
  }).min(1).messages({
    "object.min": "Minimal satu field harus diisi untuk update",
  });
}

module.exports = ProviderAvailabilityValidation;
