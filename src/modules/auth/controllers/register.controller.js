// src/modules/auth/controllers/register.controller.js
const RegisterService = require("../services/register.service");
const { success, error } = require("../../../utils/response");

class RegisterController {
  static async register(req, res) {
    const { name, email, password, phone } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown";

    try {
      const { newUser, otpRecord } = await RegisterService.register({
        name,
        email,
        password,
        phone,
        userAgent,
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
        }
      );
    } catch (err) {
      console.error("Error pada registrasi:", err);
      const status = err.statusCode || 500;
      const message = err.statusCode ? err.message : "Gagal mendaftarkan user.";
      return error(res, status, message, { detail: err.message });
    }
  }
}

module.exports = RegisterController;
