// src/controllers/telemetryController.js
const TelemetryBatch = require("../models/TelemetryBatch");
const logger = require("../utils/logger");

/**
 * GET /api/telemetry/latest-batch
 * returns the most recent full telemetry batch (with 12 inverters array)
 */
exports.getLatestBatch = async (req, res) => {
  try {
    const batch = await TelemetryBatch.findOne().sort({ created_at: -1 }).lean();
    if (!batch) return res.status(404).json({ message: "No telemetry batches found" });
    return res.json(batch);
  } catch (err) {
    logger.error("getLatestBatch error: " + (err.message || err));
    return res.status(500).json({ message: "Failed to get latest batch" });
  }
};

/**
 * GET /api/telemetry/history?limit=50
 * returns recent batches (most recent first)
 */
exports.getBatches = async (req, res) => {
  try {
    const limit = Math.min(200, parseInt(req.query.limit || "50"));
    const rows = await TelemetryBatch.find().sort({ created_at: -1 }).limit(limit).lean();
    return res.json(rows);
  } catch (err) {
    logger.error("getBatches error: " + (err.message || err));
    return res.status(500).json({ message: "Failed to get batches" });
  }
};

/**
 * GET /api/telemetry/trends?inverter_id=INV-001&limit=100
 * returns time-series of risk_score (and optional power/eff) for the specified inverter
 * across stored batches (oldest first)
 */
exports.getTrends = async (req, res) => {
  try {
    const inverter_id = req.query.inverter_id;
    if (!inverter_id) return res.status(400).json({ message: "inverter_id is required" });
    const limit = Math.min(1000, parseInt(req.query.limit || "200"));

    // find batches where this inverter appears and extract the entry
    const batches = await TelemetryBatch.find({ "inverters.inverter_id": inverter_id })
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    // map in chronological order (oldest first)
    const series = batches.reverse().map(batch => {
      const entry = (batch.inverters || []).find(i => i.inverter_id === inverter_id);
      return {
        timestamp: batch.timestamp || batch.created_at,
        risk_score: entry?.risk_score ?? null,
        status: entry?.status ?? null,
        // try to get power/eff/other from raw_row (if present)
        power: entry?.raw_row?.power !== undefined ? Number(entry.raw_row.power) : null,
        efficiency: entry?.raw_row?.efficiency !== undefined ? Number(entry.raw_row.efficiency) : null,
        temp_delta: entry?.raw_row?.temp_delta !== undefined ? Number(entry.raw_row.temp_delta) : null
      };
    });

    return res.json(series);
  } catch (err) {
    logger.error("getTrends error: " + (err.message || err));
    return res.status(500).json({ message: "Failed to get trends" });
  }
};