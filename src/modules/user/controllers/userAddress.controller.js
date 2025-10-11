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
    const userId = req.user.id; // dari middleware auth
    const { id } = req.params; // ambil dari URL /address/:id

    const result = await UserAddressService.getAddressById({
      userId,
      addressId: id,
    });

    return success(res, 200, "Alamat ditemukan.", result);
  });
}

module.exports = UserAddressController;
