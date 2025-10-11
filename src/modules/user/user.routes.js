const express = require("express");
const UserController = require("../user/controllers/user.controller");
const UserAddressController = require("../user/controllers/userAddress.controller");
const UserValidation = require("./validations/user.validation");
const UserAddressValidation = require("./validations/userAddress.validation");
const authMiddleware = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validate");
const router = express.Router();

// Semua endpoint user harus login dulu
router.get(
  "/all-user",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  UserController.getAllUsers
);
router.get(
  "/get-user",
  authMiddleware.authenticate,
  UserController.getUserById
);
router.put(
  "/update-user",
  authMiddleware.authenticate,
  validate(UserValidation.updateUser),
  UserController.editUser
);
router.delete(
  "/delete-user",
  authMiddleware.authenticate,
  UserController.deleteUser
);

router.post(
  "/address",
  authMiddleware.authenticate,
  validate(UserAddressValidation.createAddress),
  UserAddressController.addAddress
);

router.get(
  "/address/:id",
  authMiddleware.authenticate,
  UserAddressController.getAddressById
);

module.exports = router;
