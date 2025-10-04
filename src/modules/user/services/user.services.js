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

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
    };
  }

  static async updateUser(userId, data) {
    try {
      // 1. Build update object hanya untuk field yang dikirim
      const updateData = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.avatar !== undefined) updateData.avatar = data.avatar;

      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      // 2. Cek apakah ada yang diupdate
      if (Object.keys(updateData).length === 0) {
        throw new AppError("Tidak ada data yang diperbarui", 400);
      }

      // 3. Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          // Jangan return password
        },
      });

      // 4. Create notification
      await prisma.notification.create({
        data: {
          userId: updatedUser.id,
          type: "SYSTEM",
          message: `Profil berhasil diperbarui`,
          isRead: false,
        },
      });

      // 5. Return full user data (tanpa password)
      return updatedUser;
    } catch (error) {
      if (error.code === "P2002") {
        throw new AppError("Email sudah digunakan", 409);
      }
      if (error instanceof AppError) throw error;
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
