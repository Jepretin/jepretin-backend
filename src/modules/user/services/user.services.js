const { PrismaClient } = require("@prisma/client");
const prisma = require("../../../services/prisma.service");
const bcrypt = require("bcrypt");

class UserService {
  static async getAllUsers() {
    return prisma.user.findMany();
  }

  static async getUserById(userId) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  static async updateUser(userId, data) {
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
  }

  static async deleteUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User tidak ditemukan");
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
