const express = require("express");
const validate = require("../../middlewares/validate");
const authValidation = require("./validations/auth.validation");
const authMiddleware = require("../../middlewares/authMiddleware");
const RegisterController = require("./controllers/register.controller");
const OtpController = require("./controllers/otp.controller");
const AuthController = require("./controllers/auth.controller");
const PasswordController = require("./controllers/password.controller");

const router = express.Router();

//Auth
router.post(
  "/register",
  validate(authValidation.register),
  RegisterController.register
);
router.post("/login", AuthController.login);
router.post("/logout", authMiddleware.authenticate, AuthController.logout);

// OTP
router.post("/otp/verify", OtpController.verifyOtp);
router.post("/otp/resend", OtpController.resendOtp);

//Password
router.post("/forgot-password", PasswordController.forgotPassword);
router.post(
  "/reset-password",
  validate(authValidation.resetPassword),
  PasswordController.resetPassword
);

module.exports = router;
