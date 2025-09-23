const express = require("express");
const UserController = require("../user/controllers/user.controller");
const AuthValidation = require("../../validations/authValidation");
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
  validate(AuthValidation.updateUser),
  UserController.editUser
);
router.delete(
  "/delete-user",
  authMiddleware.authenticate,
  UserController.deleteUser
);

module.exports = router;
