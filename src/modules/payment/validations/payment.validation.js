const Joi = require("joi");
class PaymentValidation {
  static createPayment = Joi.object({
    orderId: Joi.string().uuid().required(),
  });
}
module.exports = PaymentValidation;
