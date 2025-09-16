// src/modules/auth/controllers/register.controller.js
const RegisterService = require("../services/register.service");
const { success, error } = require("../../../utils/response");

class RegisterController {
  static async register(req, res) {
    const { name, email, password, phone } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown"; // 🔹 Tambahkan ini

    try {
      const { newUser, otpRecord } = await RegisterService.register({
        name,
        email,
        password,
        phone,
        userAgent, // 🔹 lempar ke service
      });

      return success(
        res,
        201,
        "Registrasi berhasil. Kode OTP telah dikirim ke email Anda.",
        {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
          otp: {
            request_reset_at: otpRecord.requestResetAt,
            last_requested_at: otpRecord.lastRequestedAt,
            user_agent: otpRecord.userAgent, // 🔹 tampilkan untuk debug
          },
        }
      );
    } catch (err) {
      console.error("Error pada registrasi:", err);
      return error(res, 500, "Gagal mendaftarkan user.", {
        detail: err.message,
      });
    }
  }
}

module.exports = RegisterController;
