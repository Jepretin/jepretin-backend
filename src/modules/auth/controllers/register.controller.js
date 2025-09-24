const RegisterService = require("../services/register.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class RegisterController {
  static register = handleAsync(async (req, res) => {
    const { name, email, password, phone } = req.body;
    const userAgent = req.headers["user-agent"] || "Unknown";

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
  });
}

module.exports = RegisterController;
