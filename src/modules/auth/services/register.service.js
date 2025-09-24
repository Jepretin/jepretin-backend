const bcrypt = require("bcrypt");
const { totp } = require("otplib");
const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");
const OtpService = require("./otp.service");

totp.options = { step: 60 };

class RegisterService {
  static async register({ name, email, password, phone, userAgent }) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError("Email sudah digunakan", 409);
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser, otpRecord;

    await prisma.$transaction(async (tx) => {
      newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          isVerified: false,
        },
      });

      otpRecord = await OtpService.generateOtp({
        userId: newUser.id,
        email,
        userAgent,
        prismaClient: tx,
      });
    });

    return { newUser, otpRecord };
  }
}

module.exports = RegisterService;
