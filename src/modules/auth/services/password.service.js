const prisma = require("../../../services/prisma.service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const MailerService = require("../../mailer/mailer.service");

const SECRET_KEY = process.env.JWT_SECRET;

class PasswordService {
  static async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User tidak ditemukan");

    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        resetToken: token,
      },
    });

    const resetLink = `${process.env.FRONTEND_RESET_PASSWORD_URL}?token=${token}`;

    await MailerService.sendForgotPasswordEmail(email, resetLink);

    return { resetLink, token };
  }

  static async resetPassword({ token, password, confirmPassword }) {
    if (password !== confirmPassword) {
      throw new Error("Password dan konfirmasi tidak cocok");
    }

    const { email } = jwt.verify(token, SECRET_KEY);

    const resetToken = await prisma.passwordReset.findFirst({
      where: { resetToken: token, user: { email } },
      include: { user: true },
    });

    if (!resetToken)
      throw new Error("Token tidak valid atau sudah kedaluwarsa");

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordReset.delete({ where: { id: resetToken.id } });

    return true;
  }
}

module.exports = PasswordService;
