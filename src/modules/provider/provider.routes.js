const express = require("express");
const ProviderController = require("../provider/controllers/provider.controller");
const ProviderRoleController = require("../provider/controllers/providerRole.controller");
const ProviderCoverageController = require("../provider/controllers/providerCoverage.controller");
const ProviderPortofolioController = require("../provider/controllers/providerPortofolio.controller");
const ProviderBundleController = require("../provider/controllers/providerBundle.controller");
const ProviderToppingController = require("./controllers/providerTopping.controller");
const authMiddleware = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");
const providerValidation = require("./validations/provider.validation");
const PortofolioValidation = require("./validations/providerPortofolio.validation");
const ProviderBundleValidation = require("./validations/providerBundle.validation");
const ProviderToppingValidation = require("./validations/providerTopping.validation");
const upload = require("../../middlewares/multer");
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
  "/roles",
  authMiddleware.authenticate,
  ProviderRoleController.getRoles
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
  upload.array("media", 10),
  validate(PortofolioValidation.createPortofolio),
  ProviderPortofolioController.addPortofolio
);

router.get(
  "/all-portofolio",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  ProviderPortofolioController.getAllPortofolio
);

router.get(
  "/my-portofolio",
  authMiddleware.authenticate,
  ProviderPortofolioController.getMyPortofolio
);

router.get(
  "/get-portofolio/:providerId",
  authMiddleware.authenticate,
  ProviderPortofolioController.getPortofolioById
);

router.get(
  "/portofolio-by-location",
  authMiddleware.authenticate,
  ProviderPortofolioController.getPortofolioByCustomerLocation
);

router.put(
  "/portofolio/:id",
  authMiddleware.authenticate,
  upload.array("media", 1),
  validate(PortofolioValidation.updatePortofolio),
  ProviderPortofolioController.updatePortofolio
);

router.delete(
  "/portofolio/:id",
  authMiddleware.authenticate,
  ProviderPortofolioController.deletePortofolio
);

//Provider Bundle
router.post(
  "/bundle",
  authMiddleware.authenticate,
  validate(ProviderBundleValidation.createBundle),
  ProviderBundleController.createBundle
);

router.get(
  "/all-bundle",
  authMiddleware.authenticate,
  ProviderBundleController.getAllBundle
);

router.get(
  "/my-bundle",
  authMiddleware.authenticate,
  ProviderBundleController.getMyBundle
);

router.get(
  "/bundle/:providerId",
  authMiddleware.authenticate,
  ProviderBundleController.getBundleById
);

router.put(
  "/bundle/:id",
  authMiddleware.authenticate,
  validate(ProviderBundleValidation.updateBundle),
  ProviderBundleController.updateBundle
);

router.delete(
  "/bundle/:id",
  authMiddleware.authenticate,
  ProviderBundleController.deleteBundle
);

//Provider Topping
router.post(
  "/topping",
  authMiddleware.authenticate,
  validate(ProviderToppingValidation.createTopping),
  ProviderToppingController.createTopping
);

router.get(
  "/all-topping",
  authMiddleware.authenticate,
  ProviderToppingController.getAllTopping
);

router.get(
  "/my-topping",
  authMiddleware.authenticate,
  ProviderToppingController.getMyTopping
);

router.get(
  "/topping/:providerId",
  authMiddleware.authenticate,
  ProviderToppingController.getToppingByProviderId
);

router.put(
  "/topping/:id",
  authMiddleware.authenticate,
  validate(ProviderBundleValidation.updateBundle),
  ProviderToppingController.updateTopping
);

router.delete(
  "/topping/:id",
  authMiddleware.authenticate,
  ProviderToppingController.deleteTopping
);

module.exports = router;
