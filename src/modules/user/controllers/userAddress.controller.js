const UserAddressService = require("../services/userAddress.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class UserAddressController {
  static addAddress = handleAsync(async (req, res) => {
    const { villageId, addressDetail, isPrimary } = req.body;
    const userId = req.user.id;

    const result = await UserAddressService.addAddress({
      userId,
      villageId,
      addressDetail,
      isPrimary,
    });

    return success(res, 201, "Berhasil menambahkan Alamat. ", result);
  });

  static getAddressById = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await UserAddressService.getAddressById({
      userId,
      addressId: id,
    });

    return success(res, 200, "Alamat ditemukan.", result);
  });

  static getAllAddress = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const address = await UserAddressService.getAllAddress(userId);
    return success(res, 200, "Daftar Alamat user berhasil diambil.", address);
  });

  static updateAddress = handleAsync(async (req, res) => {
    const userId = req.user?.id;
    const { villageId, addressDetail, isPrimary } = req.body;
    const addressId = req.params.addressId;

    const result = await UserAddressService.updateAddress({
      userId,
      addressId,
      villageId,
      addressDetail,
      isPrimary,
    });

    return success(res, 200, "Alamat berhasil diperbarui.", result);
  });

  static deleteAddress = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await UserAddressService.deleteAddress({ id, userId });

    return success(res, 200, "Alamat berhasil dihapus.", result);
  });
}

module.exports = UserAddressController;
