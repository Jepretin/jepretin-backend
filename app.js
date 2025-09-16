const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const router = require("./src/routes/route"); // path disesuaikan

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Route test
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Jepretin API 🚀" });
});

// Mount routes
app.use("/api", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
