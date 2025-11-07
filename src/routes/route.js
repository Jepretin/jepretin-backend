// src/routes/route.js
const express = require("express");
const authRoutes = require("../modules/auth/auth.route");
const userRoutes = require("../modules/user/user.routes");
const wilayahRoutes = require("../modules/wilayah/wilayah.routes");
const providerRoutes = require("../modules/provider/provider.routes");
const orderRoutes = require("../modules/order/order.routes");
const paymentRoutes = require("../modules/payment/payment.routes");
const walletRoutes = require("../modules/wallet/wallet.routes");
const router = express.Router();

// gabungkan semua routes per module
router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/wilayah", wilayahRoutes);
router.use("/provider", providerRoutes);
router.use("/order", orderRoutes);
router.use("/payment", paymentRoutes);
router.use("/wallet", walletRoutes);

module.exports = router;
