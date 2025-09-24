const AppError = require("../../utils/appError");
const transporter = require("../../libs/nodemailer");

class MailerService {
  static async sendOtpEmail(email, otpCode) {
    const mailOptions = {
      from: `Jepretin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifikasi OTP untuk Registrasi",
      html: `<p>OTP Anda: <h3>${otpCode}</h3></p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      throw new AppError("Gagal mengirim OTP email", 500);
    }
  }

  static async resendOtpEmail(email, otpCode) {
    const mailOptions = {
      from: `Jepretin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Resend OTP untuk Registrasi",
      html: `<p>OTP Anda: <h3>${otpCode}</h3></p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      throw new AppError("Gagal mengirim ulang OTP email", 500);
    }
  }

  static async sendForgotPasswordEmail(email, resetLink) {
    const mailOptions = {
      from: `Jepretin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Password",
      html: `<p>Click link untuk reset password Anda: <a href="${resetLink}">${resetLink}</a></p>`,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (err) {
      throw new AppError("Gagal mengirim email reset password", 500);
    }
  }
}

module.exports = MailerService;
