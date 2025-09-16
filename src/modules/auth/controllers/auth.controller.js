const AuthService = require("../services/auth.service");
const { success, error } = require("../../../utils/response");

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;
    try {
      const result = await AuthService.login({ email, password });
      return success(res, 200, "Login berhasil.", result);
    } catch (err) {
      return error(res, 400, "Gagal login", { detail: err.message });
    }
  }

  static async logout(req, res) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(400)
        .json({ message: "Token diperlukan untuk logout." });
    }

    try {
      await AuthService.logout(token);
      return res
        .status(200)
        .json({ message: "Logout berhasil. Token di-blacklist." });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AuthController;
