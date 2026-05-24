const express = require("express");
const WithdrawalController = require("./controllers/withdrawal.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");
const WithdrawalValidation = require("./validations/withdrawal.validation");

const router = express.Router();

router.post(
  "/request",
  authMiddleware.authenticate,
  validate(WithdrawalValidation.requestWithdrawal),
  WithdrawalController.requestWithdrawal
);

router.get(
  "/my-requests",
  authMiddleware.authenticate,
  WithdrawalController.getMyRequests
);

router.get(
  "/all-requests",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  WithdrawalController.getAllRequests
);

router.get(
  "/:id",
  authMiddleware.authenticate,
  WithdrawalController.getRequestById
);

router.put(
  "/:id/approve",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  validate(WithdrawalValidation.approveWithdrawal),
  WithdrawalController.approveRequest
);

router.put(
  "/:id/reject",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  validate(WithdrawalValidation.rejectWithdrawal),
  WithdrawalController.rejectRequest
);

module.exports = router;
