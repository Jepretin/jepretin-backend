const prisma = require("../../../services/prisma.service");
const bcrypt = require("bcrypt");
const AppError = require("../../../utils/appError");

class UserService {
  //Untuk mengambil semua user (Admin Only)
  static async getAllUsers() {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!users || users.length === 0) {
      throw new AppError("Tidak ada data user yang ditemukan", 404);
    }

    return {
      totalUsers: users.length,
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })),
    };
  }

  //Untuk mengambil data user yang login
  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User tidak ditemukan", 404);
    }

    return {
      message: "Berhasil mendapatkan data user",
      data: user,
    };
  }

  // Untuk memperbarui user
  static async updateUser(userId, data) {
    try {
      const updateData = {};

      if (data.name) updateData.name = data.name.trim();
      if (data.email) updateData.email = data.email.toLowerCase().trim();
      if (data.phone) updateData.phone = data.phone.trim();
      if (data.avatar) updateData.avatar = data.avatar.trim();

      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      if (Object.keys(updateData).length === 0) {
        throw new AppError("Tidak ada data yang diperbarui", 400);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          phone: true,
          avatar: true,
          isActive: true,
          updatedAt: true,
        },
      });

      // Notifikasi otomatis
      await prisma.notification.create({
        data: {
          userId: updatedUser.id,
          type: "SYSTEM",
          message: "Profil berhasil diperbarui",
          isRead: false,
        },
      });

      return {
        message: "User berhasil diperbarui",
        data: updatedUser,
      };
    } catch (error) {
      if (error.code === "P2002") {
        throw new AppError("Email sudah digunakan oleh akun lain", 409);
      }
      if (error instanceof AppError) throw error;
      throw new AppError("Terjadi kesalahan saat memperbarui user", 500);
    }
  }

  // Untuk menghapus user (Soft Delete)
  static async deleteUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError("User tidak ditemukan", 404);
    }

    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        email: `${user.email}__deleted_${Date.now()}`,
      },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        isActive: true,
        deletedAt: true,
      },
    });

    return {
      message: "User berhasil dihapus (soft delete)",
      data: deletedUser,
    };
  }
}

module.exports = UserService;
