const express = require("express");
const ProviderController = require("../provider/controllers/provider.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");
const providerValidation = require("../../validations/providerValidation");
const router = express.Router();

// Semua endpoint user harus login dulu
router.get(
  "/all-provider",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  ProviderController.getAllProvider
);
router.get(
  "/get-provider",
  authMiddleware.authenticate,
  ProviderController.getProviderById
);
router.post(
  "/provider",
  authMiddleware.authenticate,
  validate(providerValidation),
  ProviderController.registerProvider
);

router.put(
  "/update-provider",
  authMiddleware.authenticate,
  validate(providerValidation),
  ProviderController.editProvider
);
router.delete(
  "/delete-provider",
  authMiddleware.authenticate,
  ProviderController.deleteProvider
);

module.exports = router;
