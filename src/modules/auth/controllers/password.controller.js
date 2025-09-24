const PasswordService = require("../services/password.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class PasswordController {
  static forgotPassword = handleAsync(async (req, res) => {
    const { email } = req.body;

    const { resetLink, token } = await PasswordService.forgotPassword(email);
    return success(res, 200, "Link reset password telah dikirim.", {
      reset_link: resetLink,
      token,
    });
  });

  static resetPassword = handleAsync(async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    await PasswordService.resetPassword({ token, password, confirmPassword });
    return success(res, 200, "Password berhasil direset! Silakan login.");
  });
}

module.exports = PasswordController;
