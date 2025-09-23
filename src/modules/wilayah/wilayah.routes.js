const express = require("express");
const authMiddleware = require("../../middlewares/authMiddleware");
const WilayahController = require("../wilayah/controllers/wilayah.controller");

const router = express.Router();

//Wilayah
router.get(
  "/provinces",
  authMiddleware.authenticate,
  WilayahController.getProvinces
);
router.get(
  "/regencies/:provinceId",
  authMiddleware.authenticate,
  WilayahController.getRegencies
);
router.get(
  "/districts/:regencyId",
  authMiddleware.authenticate,
  WilayahController.getDistricts
);
router.get(
  "/villages/:districtId",
  authMiddleware.authenticate,
  WilayahController.getVillages
);

module.exports = router;
