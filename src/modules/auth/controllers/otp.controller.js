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
      const status = err.statusCode || 500;
      const message = err.statusCode ? err.message : "Gagal verifikasi OTP";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async resendOtp(req, res) {
    const { email } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown"; // ambil user agent

    try {
      const { otpRecord } = await OtpService.resendOtp({ email, userAgent });

      return success(res, 200, "Kode OTP baru telah dikirim.", {
        next_request_available_at: otpRecord.requestResetAt,
      });
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode ? err.message : "Gagal mengirim ulang OTP";
      return error(res, status, message, { detail: err.message });
    }
  }
}

module.exports = OtpController;
