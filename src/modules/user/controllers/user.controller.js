const UserService = require("../services/user.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class UserController {
  static getAllUsers = handleAsync(async (req, res) => {
    const users = await UserService.getAllUsers();

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

  static deleteUser = handleAsync(async (req, res) => {
    const userId = req.user.id;
    await UserService.deleteUser(userId);

    return success(res, 200, "User berhasil dihapus.");
  });
}

module.exports = UserController;
