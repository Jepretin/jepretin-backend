const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const router = require("./src/routes/route");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./src/docs/swagger.json");
const { startCleanupJobs } = require("./src/jobs/cleanup.job");

dotenv.config();

const REQUIRED_ENV = [
  "DATABASE_URL",
  "JWT_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
  "MIDTRANS_SERVER_KEY",
  "MIDTRANS_CLIENT_KEY",
  "MIDTRANS_IS_PRODUCTION",
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

if (process.env.MIDTRANS_IS_PRODUCTION !== "true") {
  console.warn("[WARN] Midtrans is running in SANDBOX mode. Set MIDTRANS_IS_PRODUCTION=true for production.");
}

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :remote-addr :user-agent"
  )
);

app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === "/payment/webhook",
  message: {
    code: 429,
    message: "Too many requests, please try again later.",
    data: { detail: "Rate limit exceeded" },
  },
});

app.use("/api", limiter);

// serve swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route test
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Jepretin API 🚀" });
});

// Mount routes
app.use("/api", router);

// Global Error Handler (harus di paling bawah)
app.use((err, req, res, next) => {
  console.error("Error handler caught:", err); // log di console

  res.status(err.statusCode || 500).json({
    code: err.statusCode || 500,
    message: "Terjadi kesalahan server",
    data: {
      detail: err.message || "Internal Server Error",
    },
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  startCleanupJobs();
  app.listen(PORT, () => {
    console.log(`Halo aku di http://localhost:${PORT}`);
  });
}

module.exports = app;
