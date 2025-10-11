const providerPortofolioService = require("../services/providerPortofolio.service");
const imagekit = require("../../../services/imagekit.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");
const AppError = require("../../../utils/appError");

class ProviderPortofolioController {
  static addPortofolio = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { description, mediaType } = req.body;

    if (!req.files || req.files.length === 0) {
      throw new AppError("Tidak ada file yang diupload", 400);
    }

    const allowedMime = {
      image: ["image/jpeg", "image/png", "image/jpg", "image/webp"],
      video: ["video/mp4"],
    };

    const invalidFile = req.files.find(
      (file) => !allowedMime[mediaType].includes(file.mimetype)
    );

    if (invalidFile) {
      throw new AppError(
        `File "${invalidFile.originalname}" memiliki tipe "${invalidFile.mimetype}" yang tidak sesuai dengan mediaType="${mediaType}".`,
        400
      );
    }

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
          mediaType,
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

  //Update Portofolio
  static updatePortofolio = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { description, mediaType } = req.body;

    let uploadResult = null;

    if (req.files && req.files.length > 0) {
      const file = req.files[0];
      const allowedMime = {
        image: ["image/jpeg", "image/png", "image/jpg"],
        video: ["video/mp4"],
      };

      if (!allowedMime[mediaType]?.includes(file.mimetype)) {
        throw new AppError(
          `File bertipe "${file.mimetype}" tidak sesuai dengan mediaType "${mediaType}".`,
          400
        );
      }

      const result = await imagekit.upload({
        file: file.buffer.toString("base64"),
        fileName: file.originalname,
        folder: "/portofolio",
      });

      uploadResult = {
        mediaUrl: result.url,
        mediaId: result.fileId,
        mediaType: mediaType || "image",
      };
    }

    const updatedPortofolio = await providerPortofolioService.updatePortofolio({
      id,
      userId,
      description,
      mediaType,
      mediaUrl: uploadResult?.mediaUrl,
      mediaId: uploadResult?.mediaId,
    });

    return success(
      res,
      200,
      "Portofolio berhasil diperbarui",
      updatedPortofolio
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
