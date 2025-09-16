const express = require("express");
const validate = require("../../middlewares/validate");
const {
  registerSchema,
  resetPasswordSchema,
} = require("../../validations/authValidation");
const RegisterController = require("./controllers/register.controller");
const OtpController = require("./controllers/otp.controller");
const AuthController = require("./controllers/auth.controller");
const PasswordController = require("./controllers/password.controller");

const router = express.Router();

//Auth
router.post("/register", validate(registerSchema), RegisterController.register);
router.post("/login", AuthController.login);
router.post("/logout", AuthController.logout);

// OTP
router.post("/otp/verify", OtpController.verifyOtp);
router.post("/otp/resend", OtpController.resendOtp);

//Password
router.post("/forgot-password", PasswordController.forgotPassword);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  PasswordController.resetPassword
);

module.exports = router;
