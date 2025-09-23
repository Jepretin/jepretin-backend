const UserService = require("../services/user.services");

class UserController {
  static async getAllUsers(req, res) {
    try {
      const users = await UserService.getAllUsers();
      res.status(200).json({
        message: "Daftar pengguna berhasil diambil",
        data: users,
      });
    } catch (error) {
      console.error("Error fetching all users:", error.message);
      res.status(500).json({ message: "Gagal mengambil daftar pengguna" });
    }
  }

  static async getUserById(req, res) {
    const userId = req.user.id; // dari payload JWT
    try {
      const user = await UserService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Pengguna tidak ditemukan" });
      }
      res.status(200).json({
        message: "Pengguna ditemukan",
        data: user,
      });
    } catch (error) {
      console.error("Error fetching user by ID:", error.message);
      res.status(500).json({ message: "Gagal mengambil data pengguna" });
    }
  }

  static async editUser(req, res) {
    const userId = req.user.id;
    try {
      const updatedUser = await UserService.updateUser(userId, req.body);
      res.status(200).json({
        message: "User berhasil diperbarui",
        data: updatedUser,
      });
    } catch (error) {
      console.error("Error editing user:", error.message);
      res.status(500).json({ message: "Gagal memperbarui user" });
    }
  }

  static async deleteUser(req, res) {
    const userId = req.user.id;
    try {
      await UserService.deleteUser(userId);
      res.status(200).json({ message: "User berhasil dihapus" });
    } catch (error) {
      console.error("Error deleting user:", error.message);
      res.status(500).json({ message: "Gagal menghapus user" });
    }
  }
}

module.exports = UserController;
