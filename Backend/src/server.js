require("dotenv").config();

const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const inverterRoutes = require("./routes/inverterRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const chatRoutes = require("./routes/chatRoutes");
const telemetryRoutes = require("./routes/telemetryRoutes");

const { loadCSVData } = require("./utils/csvLoader");
const mlService = require("./services/mlService");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", ticketRoutes);
app.use("/api/inverters", inverterRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/telemetry", telemetryRoutes);
// in src/server.js (or wherever you set routes)

app.get("/", (req, res) => {
  res.send("Backend Running");
});

const PORT = process.env.PORT || 8000;

async function startServer() {

  await loadCSVData();

  // await mlService.initModel();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

}

startServer();