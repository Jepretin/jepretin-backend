const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("./src/routes/route"); // path disesuaikan
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./src/docs/swagger.json");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// serve swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route test
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Jepretin API 🚀" });
});

// Mount routes
app.use("/api", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Halo aku di http://localhost:${PORT}`);
});
