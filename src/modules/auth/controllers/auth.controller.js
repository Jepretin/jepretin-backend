const AuthService = require("../services/auth.service");
const { success, error } = require("../../../utils/response");

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;
    try {
      const result = await AuthService.login({ email, password });
      return success(res, 200, "Login berhasil.", result);
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode ? err.message : "Gagal login";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async logout(req, res) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return error(res, 400, "Token diperlukan untuk logout.");
    }

    try {
      const result = await AuthService.logout(token);
      return success(res, 200, "Logout berhasil.", result);
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode ? err.message : "Gagal logout.";
      return error(res, status, message, { message: err.message });
    }
  }
}

module.exports = AuthController;
