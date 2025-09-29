const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const router = require("./src/routes/route");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./src/docs/swagger.json");

dotenv.config();

const app = express();

app.use(cors());
app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms :remote-addr :user-agent"
  )
);

app.use(express.json());

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
app.listen(PORT, () => {
  console.log(`Halo aku di http://localhost:${PORT}`);
});
