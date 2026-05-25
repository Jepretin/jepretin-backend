const express = require("express");
const NotificationController = require("./controllers/notification.controller");
const NotificationTemplateController = require("./controllers/notificationTemplate.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware.authenticate,
  NotificationController.getNotifications
);

router.get(
  "/unread-count",
  authMiddleware.authenticate,
  NotificationController.getUnreadCount
);

router.put(
  "/:id/read",
  authMiddleware.authenticate,
  NotificationController.markAsRead
);

router.put(
  "/read-all",
  authMiddleware.authenticate,
  NotificationController.markAllAsRead
);

router.post(
  "/template",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  NotificationTemplateController.createTemplate
);

router.get(
  "/template",
  authMiddleware.authenticate,
  NotificationTemplateController.getTemplates
);

router.get(
  "/template/:id",
  authMiddleware.authenticate,
  NotificationTemplateController.getTemplateById
);

router.put(
  "/template/:id",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  NotificationTemplateController.updateTemplate
);

router.delete(
  "/template/:id",
  authMiddleware.authenticate,
  authMiddleware.authorize("ADMIN"),
  NotificationTemplateController.deleteTemplate
);

module.exports = router;
