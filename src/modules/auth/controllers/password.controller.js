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
      return error(res, 400, "Gagal mengirim link reset password.", {
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
      return error(res, 400, "Gagal reset password.", { detail: err.message });
    }
  }
}

module.exports = PasswordController;
