// src/models/TelemetryBatch.js
const mongoose = require("mongoose");

const InverterEntrySchema = new mongoose.Schema({
  inverter_id: { type: String, required: true }, // "INV-001"
  risk_score: { type: Number, required: true }, // normalized percent (0..100)
  status: { type: String, required: true }, // "Healthy", "Needs Cleaning", "Needs Repair"
  action_required: { type: String, default: "None" },
  prediction_id: { type: mongoose.Schema.Types.ObjectId, ref: "Prediction", default: null },
  raw_row: { type: mongoose.Schema.Types.Mixed, required: true } // full CSV row as received
}, { _id: false });

const TelemetryBatchSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true }, // time snapshot was created
  inverters: { type: [InverterEntrySchema], required: true }, // array of 12 entries
  created_at: { type: Date, default: Date.now, index: true },
  source: { type: String, default: "csv" } // optional
}, {
  versionKey: false
});

TelemetryBatchSchema.index({ created_at: -1 });

module.exports = mongoose.model("TelemetryBatch", TelemetryBatchSchema);