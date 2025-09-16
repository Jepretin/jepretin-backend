// src/routes/route.js
const express = require("express");
const authRoutes = require("../modules/auth/auth.route");

const router = express.Router();

// gabungkan semua routes per module
router.use("/auth", authRoutes);

module.exports = router;
