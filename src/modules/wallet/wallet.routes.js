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

// router.post(
//   "/init",
//   authMiddleware.authenticate,
//   validate(WalletValidation.initializeWallet),
//   WalletController.initializeWallet
// );

router.post(
  "/update-balance",
  authMiddleware.authenticate,
  validate(WalletValidation.updateBalance),
  WalletController.updateBalance
);

router.post(
  "/credit",
  validate(WalletValidation.creditFromPayment),
  WalletController.creditFromPayment
);

module.exports = router;
