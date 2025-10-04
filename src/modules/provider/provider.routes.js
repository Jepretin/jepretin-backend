const express = require("express");
const ProviderController = require("../provider/controllers/provider.controller");
const ProviderRoleController = require("../provider/controllers/providerRole.controller");
const ProviderCoverageController = require("../provider/controllers/providerCoverage.controller");
const ProviderPortofolioController = require("../provider/controllers/providerPortofolio.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");
const providerValidation = require("./validations/provider.validation");
const PortofolioValidation = require("./validations/providerPortofolio.validation");
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

//Provider Role
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

//Provider Coverages
router.post(
  "/coverage",
  authMiddleware.authenticate,
  ProviderCoverageController.addCoverage
);

router.delete(
  "/coverage/:districtId",
  authMiddleware.authenticate,
  ProviderCoverageController.removeCoverage
);

router.get(
  "/coverage",
  authMiddleware.authenticate,
  ProviderCoverageController.getProviderCoverage
);

router.get(
  "/coverage/:districtId",
  authMiddleware.authenticate,
  ProviderCoverageController.findProvidersByDistrict
);

//Provider Portofolio
router.post(
  "/portofolio",
  authMiddleware.authenticate,
  validate(PortofolioValidation.createPortofolio),
  ProviderPortofolioController.addPortofolio
);

router.get(
  "/portofolio",
  authMiddleware.authenticate,
  ProviderPortofolioController.getAllPortofolio
);
module.exports = router;
