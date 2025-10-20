const express = require("express");
const validate = require("../../middlewares/validate");
const OrderValidation = require("./validations/order.validation");
const authMiddleware = require("../../middlewares/authMiddleware");
const OrderController = require("./controllers/order.controller");

const router = express.Router();

//Auth
router.post(
  "/order",
  authMiddleware.authenticate,
  validate(OrderValidation.createOrder),
  OrderController.addOrder
);

router.get("/order", authMiddleware.authenticate, OrderController.getAllOrder);

module.exports = router;
