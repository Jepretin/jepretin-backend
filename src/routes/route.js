// src/routes/route.js
const express = require("express");
const authRoutes = require("../modules/auth/auth.route");
const userRoutes = require("../modules/user/user.routes");
const wilayahRoutes = require("../modules/wilayah/wilayah.routes");

const router = express.Router();

// gabungkan semua routes per module
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/wilayah", wilayahRoutes);

module.exports = router;
