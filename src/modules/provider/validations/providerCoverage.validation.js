const Joi = require("joi");

class ProviderCoverageValidation {
  static addCoverage() {
    return Joi.object({
      districtId: Joi.string().uuid().required().messages({
        "string.empty": "districtId wajib diisi",
        "string.guid": "districtId harus berupa UUID",
      }),
    });
  }
}
module.exports = ProviderCoverageValidation;
