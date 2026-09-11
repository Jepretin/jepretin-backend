const UserService = require("../services/user.service");
const imagekit = require("../../../services/imagekit.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");
const AppError = require("../../../utils/appError");

class UserController {
  static getAllUsers = handleAsync(async (req, res) => {
    const users = await UserService.getAllUsers(req.query);

    return success(res, 200, "Daftar User berhasil diambil", users);
  });

  static getUserById = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const user = await UserService.getUserById(userId);

    return success(res, 200, "User ditemukan.", user);
  });

  static editUser = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const updatedUser = await UserService.updateUser(userId, req.body);
    return success(res, 200, "User berhasil diperbarui.", updatedUser);
  });

  static updateAvatar = handleAsync(async (req, res) => {
    const userId = req.user.id;

    if (!req.file) {
      throw new AppError("Tidak ada file avatar yang diupload", 400);
    }

    const allowedMime = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedMime.includes(req.file.mimetype)) {
      throw new AppError("Format file tidak didukung (harus berupa gambar)", 400);
    }

    const uploadResult = await imagekit.upload({
      file: req.file.buffer.toString("base64"),
      fileName: `avatar-${userId}-${Date.now()}`,
      folder: "/avatars",
    });

    const updatedUser = await UserService.updateAvatar(userId, uploadResult.url);
    return success(res, 200, "Avatar berhasil diperbarui.", updatedUser);
  });

  static deleteUser = handleAsync(async (req, res) => {
    const userId = req.user.id;
    await UserService.deleteUser(userId);

    return success(res, 200, "User berhasil dihapus.");
  });
}

module.exports = UserController;
