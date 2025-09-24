const ProviderService = require("../services/provider.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class ProviderController {
  static registerProvider = handleAsync(async (req, res) => {
    const { experience, bankName, bankAccountNumber, bankAccountName } =
      req.body;
    const userId = req.user.id; // dari payload JWT (tabel user)

    const Provider = await ProviderService.registerProvider({
      userId,
      experience,
      bankName,
      bankAccountNumber,
      bankAccountName,
    });

    return success(res, 200, "Provider berhasil diregistrasi.", {
      Provider,
    });
  });

  static getAllProvider = handleAsync(async (req, res) => {
    const providers = await ProviderService.getAllProvider();
    return success(res, 200, "Daftar provider berhasil diambil.", providers);
  });

  static getProviderById = handleAsync(async (req, res) => {
    const userId = req.user.id; // ambil dari JWT payload
    const provider = await ProviderService.getProviderById(userId);

    return success(res, 200, "Provider ditemukan.", provider);
  });

  static editProvider = handleAsync(async (req, res) => {
    const userId = req.user.id;

    const updatedProvider = await ProviderService.updateProvider(
      userId,
      req.body
    );
    return success(res, 200, "Provider berhasil diperbarui.", updatedProvider);
  });

  static deleteProvider = handleAsync(async (req, res) => {
    const userId = req.user.id;

    await ProviderService.deleteProvider(userId);
    return success(res, 200, "Provider berhasil dihapus.");
  });
}

module.exports = ProviderController;
