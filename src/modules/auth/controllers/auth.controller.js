const AuthService = require("../services/auth.service");
const { success, error } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class AuthController {
  static login = handleAsync(async (req, res) => {
    const { email, password } = req.body;

    const result = await AuthService.login({ email, password });
    return success(res, 200, "Login berhasil.", result);
  });

  static logout = handleAsync(async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return error(res, 400, "Token diperlukan untuk logout.");
    }

    const result = await AuthService.logout(token);
    return success(res, 200, "Logout berhasil.", result);
  });
}

module.exports = AuthController;
