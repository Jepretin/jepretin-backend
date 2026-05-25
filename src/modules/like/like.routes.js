const express = require("express");
const LikeController = require("./controllers/like.controller");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/toggle",
  authMiddleware.authenticate,
  LikeController.toggleLike
);

router.get(
  "/count/:portfolioId",
  authMiddleware.authenticate,
  LikeController.getLikeCount
);

router.get(
  "/my-likes",
  authMiddleware.authenticate,
  LikeController.getMyLikes
);

module.exports = router;
