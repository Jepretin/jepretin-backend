const express = require("express");
const WalletController = require("./controllers/wallet.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");
const WalletValidation = require("./validations/wallet.validation");
const router = express.Router();

router.get(
  "/wallet",
  authMiddleware.authenticate,
  WalletController.getMyWallet
);

router.post(
  "/update-balance",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  validate(WalletValidation.updateBalance),
  WalletController.updateBalance
);

module.exports = router;
