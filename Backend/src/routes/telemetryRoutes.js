// src/routes/telemetryRoutes.js
const express = require("express");
const router = express.Router();
const telemetryController = require("../controllers/telemetryController");

router.get("/latest-batch", telemetryController.getLatestBatch);
router.get("/history", telemetryController.getBatches); // ?limit=50
router.get("/trends", telemetryController.getTrends);   // ?inverter_id=INV-001&limit=200

module.exports = router;