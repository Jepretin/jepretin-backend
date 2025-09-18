const PasswordService = require("../services/password.service");
const { success, error } = require("../../../utils/response");

class PasswordController {
  static async forgotPassword(req, res) {
    const { email } = req.body;
    try {
      const { resetLink, token } = await PasswordService.forgotPassword(email);
      return success(res, 200, "Link reset password telah dikirim.", {
        reset_link: resetLink,
        token,
      });
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal mengirim link reset password.";
      return error(res, status, message, {
        detail: err.message,
      });
    }
  }

  static async resetPassword(req, res) {
    const { token, password, confirmPassword } = req.body;
    try {
      await PasswordService.resetPassword({ token, password, confirmPassword });
      return success(res, 200, "Password berhasil direset! Silakan login.");
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode ? err.message : "Gagal reset password";
      return error(res, status, message, { detail: err.message });
    }
  }
}

module.exports = PasswordController;
