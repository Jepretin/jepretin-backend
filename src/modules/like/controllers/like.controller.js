const LikeService = require("../services/like.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class LikeController {
  static toggleLike = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { portfolioId } = req.body;

    const result = await LikeService.toggleLike(userId, portfolioId);
    return success(res, 200, result.message, result);
  });

  static getLikeCount = handleAsync(async (req, res) => {
    const { portfolioId } = req.params;

    const result = await LikeService.getLikeCount(portfolioId);
    return success(res, 200, "Jumlah like berhasil diambil", result);
  });

  static getMyLikes = handleAsync(async (req, res) => {
    const userId = req.user.id;

    const result = await LikeService.getMyLikes(userId);
    return success(res, 200, "Daftar like berhasil diambil", result);
  });
}

module.exports = LikeController;
