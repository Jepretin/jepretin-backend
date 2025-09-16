const transporter = require("../../libs/nodemailer");

class MailerService {
  static async sendOtpEmail(email, otpCode) {
    const mailOptions = {
      from: `Jepretin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verifikasi OTP untuk Registrasi",
      html: `
        <p>Untuk menyelesaikan pendaftaran Anda, masukkan kode OTP berikut:</p>
        <h3>${otpCode}</h3>
        <p>Kode ini akan kedaluwarsa dalam 1 menit.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  static async resendOtpEmail(email, otpCode) {
    const mailOptions = {
      from: `Jepretin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Resend OTP untuk Registrasi",
      html: `
        <p>Permintaan untuk mengirim ulang OTP diterima. Masukkan kode OTP berikut:</p>
        <h3>${otpCode}</h3>
        <p>Kode ini akan kedaluwarsa dalam 1 menit.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  static async sendForgotPasswordEmail(email, resetLink) {
    const mailOptions = {
      from: `Jepretin <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Password",
      html: `
        <p>Click link di bawah ini untuk reset password Anda:</p>
        <a href="${resetLink}">${resetLink}</a>
      `,
    };

    await transporter.sendMail(mailOptions);
  }
}

module.exports = MailerService;
