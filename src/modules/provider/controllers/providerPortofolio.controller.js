const providerPortofolioService = require("../services/providerPortofolio.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class ProviderPortofolioController {
  static addPortofolio = handleAsync(async (req, res) => {
    const { mediaUrl, mediaId, mediaType, description } = req.body;
    const userId = req.user.id;

    const portofolio = await providerPortofolioService.addPortofolio({
      userId,
      mediaUrl,
      mediaId,
      mediaType,
      description,
    });

    return success(res, 201, "Berhasil menambahkan portofolio.", portofolio);
  });

  static getAllPortofolio = handleAsync(async (req, res) => {
    const portofolios = await providerPortofolioService.getAllPortofolio();
    return success(res, 200, "Berhasil Mengambil Portofolio.", portofolios);
  });
}

module.exports = ProviderPortofolioController;
