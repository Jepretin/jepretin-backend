const express = require("express");
const validate = require("../../middlewares/validate");
const authMiddleware = require("../../middlewares/authMiddleware");
const PaymentCategoryController = require("./controllers/paymentCategory.controller");
const PaymentMethodController = require("./controllers/paymentMethod.controller");
const PaymentController = require("./controllers/payment.controller");
const PaymentValidation = require("./validations/payment.validation");
const PaymentMethodValidation = require("./validations/paymentMethod.validation");

const router = express.Router();

//Payment Category
router.post(
  "/category",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  PaymentCategoryController.addPaymentCategory
);
router.get(
  "/category",
  authMiddleware.authenticate,
  PaymentCategoryController.getPaymentCategory
);
router.delete(
  "/category/:id",
  authMiddleware.authenticate,
  PaymentCategoryController.removePaymentCategory
);

//Payment Method
router.post(
  "/method",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  validate(PaymentMethodValidation.createPaymentMethod),
  PaymentMethodController.addPaymentMethod
);
router.get(
  "/method",
  authMiddleware.authenticate,
  PaymentMethodController.getPaymentMethod
);
router.delete(
  "/method/:id",
  authMiddleware.authenticate,
  PaymentMethodController.removePaymentMethod
);

//Payment
router.post(
  "/payment",
  authMiddleware.authenticate,
  validate(PaymentValidation.createPayment),
  PaymentController.createPayment
);

router.post(
  "/webhook",
  express.json({ type: "*/*" }),
  PaymentController.handleWebhook
);

module.exports = router;
