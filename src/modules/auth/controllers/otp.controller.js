// src/modules/auth/controllers/otp.controller.js
const OtpService = require("../services/otp.service");
const { success, error } = require("../../../utils/response");

class OtpController {
  static async verifyOtp(req, res) {
    const { email, otpCode } = req.body;

    try {
      const { updatedUser } = await OtpService.verifyOtp({ email, otpCode });

      return success(res, 200, "Verifikasi berhasil.", {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          isVerified: updatedUser.isVerified,
        },
      });
    } catch (err) {
      return error(res, 400, "Gagal verifikasi OTP.", { detail: err.message });
    }
  }

  static async resendOtp(req, res) {
    const { email } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown"; // ambil user agent

    try {
      const { otpRecord } = await OtpService.resendOtp({ email, userAgent });

      return success(res, 200, "Kode OTP baru telah dikirim.", {
        last_requested_at: otpRecord.lastRequestedAt,
        request_reset_at: otpRecord.requestResetAt,
        user_agent: otpRecord.userAgent, // tampilkan juga di response
      });
    } catch (err) {
      return error(res, 400, "Gagal mengirim ulang OTP.", {
        detail: err.message,
      });
    }
  }
}

module.exports = OtpController;
