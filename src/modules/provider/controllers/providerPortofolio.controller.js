const providerPortofolioService = require("../services/providerPortofolio.service");
const imagekit = require("../../../services/imagekit.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class ProviderPortofolioController {
  static addPortofolio = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { description, mediaType } = req.body;

    const uploadResults = await Promise.all(
      req.files.map(async (file) => {
        const result = await imagekit.upload({
          file: file.buffer.toString("base64"),
          fileName: file.originalname,
          folder: "/portofolio",
        });

        return {
          mediaUrl: result.url,
          mediaId: result.fileId,
          mediaType: mediaType || "image",
        };
      })
    );

    const portfolios = await Promise.all(
      uploadResults.map((media) =>
        providerPortofolioService.addPortofolio({
          userId,
          mediaUrl: media.mediaUrl,
          mediaId: media.mediaId,
          mediaType: media.mediaType,
          description,
        })
      )
    );
    return success(res, 201, "Berhasil menambahkan portofolio.", portfolios);
  });

  static getAllPortofolio = handleAsync(async (req, res) => {
    const portofolios = await providerPortofolioService.getAllPortofolio();
    return success(
      res,
      200,
      "Berhasil Mengambil Semua Portofolio.",
      portofolios
    );
  });

  static getMyPortofolio = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const portofolio = await providerPortofolioService.getMyPortofolio(userId);
    return success(
      res,
      200,
      "Berhasil mendapatkan portofolio provider.",
      portofolio
    );
  });

  static getPortofolioById = handleAsync(async (req, res) => {
    const { providerId } = req.params;
    const portofolios = await providerPortofolioService.getPortofolioById(
      providerId
    );
    return success(
      res,
      200,
      "Berhasil mendapatkan portofolio provider.",
      portofolios
    );
  });

  static getPortofolioByCustomerLocation = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const portfolios =
      await providerPortofolioService.getPortofolioByCustomerLocation(userId);

    return success(
      res,
      200,
      "Berhasil mendapatkan portofolio sesuai lokasi.",
      portfolios
    );
  });

  static deletePortofolio = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    await providerPortofolioService.deletePortofolio(id, userId);
    return success(res, 200, "Portofolio berhasil dihapus.");
  });
}

module.exports = ProviderPortofolioController;
