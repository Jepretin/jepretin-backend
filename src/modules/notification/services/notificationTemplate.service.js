const prisma = require("../../../services/prisma.service");
const AppError = require("../../../utils/appError");

class NotificationTemplateService {
  static async createTemplate({ title, type, message }) {
    const existing = await prisma.notificationTemplate.findFirst({
      where: { title, deletedAt: null },
    });
    if (existing) throw new AppError("Template dengan judul ini sudah ada", 400);

    return prisma.notificationTemplate.create({
      data: { title, type, message },
    });
  }

  static async getTemplates() {
    return prisma.notificationTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        message: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async getTemplateById(id) {
    const template = await prisma.notificationTemplate.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        title: true,
        type: true,
        message: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!template) throw new AppError("Template tidak ditemukan", 404);
    return template;
  }

  static async updateTemplate(id, { title, type, message }) {
    const template = await prisma.notificationTemplate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!template) throw new AppError("Template tidak ditemukan", 404);

    if (title) {
      const duplicate = await prisma.notificationTemplate.findFirst({
        where: { title, deletedAt: null, id: { not: id } },
      });
      if (duplicate) throw new AppError("Judul template sudah ada", 400);
    }

    return prisma.notificationTemplate.update({
      where: { id },
      data: {
        title: title ?? template.title,
        type: type ?? template.type,
        message: message ?? template.message,
      },
      select: {
        id: true,
        title: true,
        type: true,
        message: true,
        updatedAt: true,
      },
    });
  }

  static async deleteTemplate(id) {
    const template = await prisma.notificationTemplate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!template) throw new AppError("Template tidak ditemukan", 404);

    return prisma.notificationTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = NotificationTemplateService;
