const NotificationTemplateService = require("../services/notificationTemplate.service");
const { success } = require("../../../utils/response");
const handleAsync = require("../../../utils/handleAsync");

class NotificationTemplateController {
  static createTemplate = handleAsync(async (req, res) => {
    const { title, type, message } = req.body;

    const result = await NotificationTemplateService.createTemplate({
      title,
      type,
      message,
    });

    return success(res, 201, "Template notifikasi berhasil dibuat", result);
  });

  static getTemplates = handleAsync(async (req, res) => {
    const result = await NotificationTemplateService.getTemplates();
    return success(res, 200, "Daftar template notifikasi berhasil diambil", result);
  });

  static getTemplateById = handleAsync(async (req, res) => {
    const { id } = req.params;

    const result = await NotificationTemplateService.getTemplateById(id);
    return success(res, 200, "Template notifikasi berhasil diambil", result);
  });

  static updateTemplate = handleAsync(async (req, res) => {
    const { id } = req.params;
    const { title, type, message } = req.body;

    const result = await NotificationTemplateService.updateTemplate(id, {
      title,
      type,
      message,
    });

    return success(res, 200, "Template notifikasi berhasil diperbarui", result);
  });

  static deleteTemplate = handleAsync(async (req, res) => {
    const { id } = req.params;

    await NotificationTemplateService.deleteTemplate(id);
    return success(res, 200, "Template notifikasi berhasil dihapus");
  });
}

module.exports = NotificationTemplateController;
