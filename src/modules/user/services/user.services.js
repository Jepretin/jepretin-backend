const prisma = require("../../../services/prisma.service");
const bcrypt = require("bcrypt");
const AppError = require("../../../utils/appError");

class UserService {
  static async getAllUsers() {
    const users = prisma.user.findMany();
    if (!users) {
      throw new AppError("Tidak ada Data User", 404);
    }
    return users;
  }

  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User tidak ditemukan", 404);
    }

    return user;
  }

  static async updateUser(userId, data) {
    try {
      const updateData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        avatar: data.avatar,
      };

      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      await prisma.notification.create({
        data: {
          userId: updatedUser.id,
          type: "SYSTEM",
          message: `Perubahan profil berhasil!`,
          isRead: false,
        },
      });

      return updatedUser;
    } catch (error) {
      throw new AppError("Gagal memperbarui User", 500);
    }
  }

  static async deleteUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User tidak ditemukan", 404);
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,

        email: `${user.email}__deleted_${Date.now()}`,
      },
    });
  }
}

module.exports = UserService;
