// src/modules/auth/controllers/otp.controller.js
const OtpService = require("../services/otp.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class OtpController {
  static verifyOtp = handleAsync(async (req, res) => {
    const { email, otpCode } = req.body;

    const { updatedUser } = await OtpService.verifyOtp({ email, otpCode });

    return success(res, 200, "Verifikasi berhasil.", {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isVerified: updatedUser.isVerified,
      },
    });
  });

  static resendOtp = handleAsync(async (req, res) => {
    const { email } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown"; // ambil user agent

    const { otpRecord } = await OtpService.resendOtp({ email, userAgent });

    return success(res, 200, "Kode OTP baru telah dikirim.", {
      next_request_available_at: otpRecord.requestResetAt,
    });
  });
}

module.exports = OtpController;
