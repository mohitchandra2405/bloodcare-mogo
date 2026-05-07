require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDatabase = require("./config/db");
const { ensureSeedData } = require("./data/bootstrap");
const authRoutes = require("./routes/authRoutes");
const bloodRoutes = require("./routes/bloodRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const corsOrigins = String(process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors(
    corsOrigins.length
      ? {
          origin: corsOrigins,
        }
      : {}
  )
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "BloodCare Nexus backend is running with MongoDB." });
});

app.use("/api/auth", authRoutes);
app.use("/api/blood", bloodRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.message || "Unexpected server error.",
  });
});

async function startServer() {
  try {
    await connectDatabase();
    await ensureSeedData();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server.", error);
    process.exit(1);
  }
}

startServer();
