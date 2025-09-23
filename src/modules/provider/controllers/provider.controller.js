const ProviderService = require("../services/provider.service");
const { success, error } = require("../../../utils/response");

class ProviderController {
  static async registerProvider(req, res) {
    const { experience, bankName, bankAccountNumber, bankAccountName } =
      req.body;
    const userId = req.user.id; // dari payload JWT (tabel user)
    try {
      const newProvider = await ProviderService.registerProvider({
        userId,
        experience,
        bankName,
        bankAccountNumber,
        bankAccountName,
      });

      return success(res, 200, "Provider berhasil diregistrasi.", {
        provider: {
          id: newProvider.id,
          experience: newProvider.experience,
          bankName: newProvider.bankName,
          bankAccountNumber: newProvider.bankAccountNumber,
          bankAccountName: newProvider.bankAccountName,
        },
      });
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal registrasi provider";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async getAllProvider(req, res) {
    try {
      const providers = await ProviderService.getAllProvider();
      return success(res, 200, "Daftar provider berhasil diambil.", providers);
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal mengambil daftar provider";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async getProviderById(req, res) {
    const userId = req.user.id; // ambil dari JWT payload
    try {
      const provider = await ProviderService.getProviderById(userId);
      if (!provider) {
        return error(res, 404, "Provider tidak ditemukan", {
          detail: "Data kosong",
        });
      }
      return success(res, 200, "Provider ditemukan.", provider);
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal mengambil data provider";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async editProvider(req, res) {
    const userId = req.user.id;
    try {
      const updatedProvider = await ProviderService.updateProvider(
        userId,
        req.body
      );
      return success(
        res,
        200,
        "Provider berhasil diperbarui.",
        updatedProvider
      );
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode
        ? err.message
        : "Gagal memperbarui provider";
      return error(res, status, message, { detail: err.message });
    }
  }

  static async deleteProvider(req, res) {
    const userId = req.user.id;
    try {
      await ProviderService.deleteProvider(userId);
      return success(res, 200, "Provider berhasil dihapus.");
    } catch (err) {
      const status = err.statusCode || 500;
      const message = err.statusCode ? err.message : "Gagal menghapus provider";
      return error(res, status, message, { detail: err.message });
    }
  }
}

module.exports = ProviderController;
