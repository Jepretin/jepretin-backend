const express = require("express");
const ProviderController = require("../provider/controllers/provider.controller");
const ProviderRoleController = require("../provider/controllers/providerRole.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");
const providerValidation = require("../../validations/providerValidation");
const router = express.Router();

// Provider
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
  validate(providerValidation.register()),
  ProviderController.registerProvider
);

router.put(
  "/update-provider",
  authMiddleware.authenticate,
  validate(providerValidation.updateExperience()),
  ProviderController.updateExperience
);

router.put(
  "/update-status/:id",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  validate(providerValidation.updateStatus()),
  ProviderController.updateStatus
);

router.delete(
  "/delete-provider",
  authMiddleware.authenticate,
  ProviderController.deleteProvider
);

//Provder Role
router.post(
  "/assign-role",
  authMiddleware.authenticate,
  ProviderRoleController.assignRole
);
router.get(
  "/:providerId/roles",
  authMiddleware.authenticate,
  ProviderRoleController.getRolesByProvider
);
router.delete(
  "/remove-role",
  authMiddleware.authenticate,
  ProviderRoleController.removeRole
);

module.exports = router;
