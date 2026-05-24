const WithdrawalService = require("../services/withdrawal.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class WithdrawalController {
  static requestWithdrawal = handleAsync(async (req, res) => {
    const { amount, bankName, bankAccountNumber, bankAccountName } = req.body;
    const userId = req.user.id;

    const result = await WithdrawalService.requestWithdrawal({
      userId,
      amount,
      bankName,
      bankAccountNumber,
      bankAccountName,
    });

    return success(res, 201, result.message, result.data);
  });

  static getMyRequests = handleAsync(async (req, res) => {
    const userId = req.user.id;
    const result = await WithdrawalService.getMyRequests(userId);
    return success(res, 200, "Riwayat penarikan berhasil diambil", result);
  });

  static getAllRequests = handleAsync(async (req, res) => {
    const result = await WithdrawalService.getAllRequests();
    return success(res, 200, "Semua permintaan penarikan berhasil diambil", result);
  });

  static getRequestById = handleAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await WithdrawalService.getRequestById(userId, id);
    return success(res, 200, "Detail penarikan berhasil diambil", result);
  });

  static approveRequest = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body || {};

    const result = await WithdrawalService.approveRequest(id, note);
    return success(res, 200, result.message, result.data);
  });

  static rejectRequest = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;

    const result = await WithdrawalService.rejectRequest(id, note);
    return success(res, 200, result.message, result.data);
  });
}

module.exports = WithdrawalController;
