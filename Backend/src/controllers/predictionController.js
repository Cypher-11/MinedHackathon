// src/controllers/predictionController.js
const Prediction = require("../models/Prediction");
const Inverter = require("../models/Inverter");
const Ticket = require("../models/Ticket");
const TelemetryBatch = require("../models/TelemetryBatch");

const { inverterData, inverterPointers } = require("../utils/csvLoader");
const logger = require("../utils/logger");

function mapInverterId(id) {
  const num = parseInt(id);
  if (isNaN(num)) return String(id);
  return "INV-" + String(num + 1).padStart(3, "0");
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function randomBoost() { return Math.floor(Math.random() * 16); } // 0..15

function normalizeRisk(raw) {
  if (raw === null || raw === undefined || raw === "") return 0;
  const s = String(raw).trim().replace("%", "");
  const n = parseFloat(s);
  if (isNaN(n)) return 0;

  let pct;
  if (Math.abs(n) <= 1) pct = n * 100;           
  else if (n > 1 && n <= 100) pct = n;           
  else if (n > 100 && n <= 10000) pct = n / 100; 
  else pct = Math.min(n, 100);

  if (!isFinite(pct) || isNaN(pct)) pct = 0;
  pct = Math.max(0, Math.min(100, pct));
  return Number(pct.toFixed(4));
}

exports.runPrediction = async (req, res) => {
  try {
    logger.info("Prediction request received");
    await sleep(10000);

    const results = [];
    const batchInverters = []; 
    const inverters = Object.keys(inverterPointers || {});
    logger.info(`Total inverters to process: ${inverters.length}`);

    for (const inverter_id of inverters) {
      const pointer = inverterPointers[inverter_id];
      const rows = inverterData[inverter_id];

      if (!rows || pointer >= rows.length) {
        logger.info(`No more CSV data for inverter ${inverter_id}`);
        continue;
      }

      const row = rows[pointer];
      const dbId = mapInverterId(inverter_id);

      // flexible keys for risk and fail flag
      const rawRiskRaw = row.risk_score ?? row.risk ?? row["risk_score"] ?? "";
      const rawFail = row.fail_next_7_days ?? row.fail_next_7 ?? row["fail_next_7_days"] ?? row["fail_next_7"] ?? "";

      let risk = normalizeRisk(rawRiskRaw);
      const failNext7 = (String(rawFail).trim() === "1" || Number(rawFail) === 1) ? 1 : 0;
      logger.info(`Raw CSV risk for ${dbId}: '${rawRiskRaw}' -> normalized: ${risk}% | fail_next_7_days: ${failNext7}`);

      if (failNext7 === 1 && risk < 50) {
        risk = 50;
      }

      if (risk >= 50) {
        risk = risk + 10;
        const boost = randomBoost();
        risk = risk + boost;
        risk = Math.min(100, Number(risk.toFixed(4)));
        logger.info(`Risk adjusted for ${dbId} -> +10 and +${boost} => ${risk}%`);
      }

      // determine action & status strictly
      let actionRequired = "None";
      let status = "Healthy";
      if (risk <= 45) {
        actionRequired = "None";
        status = "Healthy";
      } else if (risk > 45 && risk < 50) {
        actionRequired = "Cleaning";
        status = "Needs Cleaning";
      } else {
        actionRequired = "Repair";
        status = "Needs Repair";
      }

      // store prediction
      const predictionDoc = await Prediction.create({
        inverter_id: dbId,
        timestamp: new Date(),
        prediction_window: "7-10 days",
        risk_score: Number(risk.toFixed(4)),
        action_required: actionRequired,
        top_features: {
          power: row.power !== undefined ? parseFloat(row.power) : null,
          efficiency: row.efficiency !== undefined ? parseFloat(row.efficiency) : null,
          temp_delta: row.temp_delta !== undefined ? parseFloat(row.temp_delta) : null
        },
        genai_context_string: `Inverter ${dbId} has ${risk.toFixed(2)}% risk. Recommended action: ${actionRequired}.`,
        raw_ml_response: {
          csv_raw_risk: rawRiskRaw,
          fail_next_7_days: rawFail
        }
      });

      // update inverter top-level doc
      await Inverter.updateOne(
        { inverter_id: dbId },
        {
          $set: {
            current_status: status,
            latest_prediction: {
              prediction_window: predictionDoc.prediction_window,
              risk_score: predictionDoc.risk_score,
              genai_context_string: predictionDoc.genai_context_string,
              top_features: predictionDoc.top_features
            },
            last_updated: new Date()
          }
        },
        { upsert: true }
      );

      if (actionRequired !== "None") {
        const lastTicket = await Ticket.findOne().sort({ created_at: -1 });
        let nextId = 1;
        if (lastTicket && lastTicket.ticket_id) {
          const lastNumber = parseInt(lastTicket.ticket_id.split("-")[1]) || 0;
          nextId = lastNumber + 1;
        }
        const newTicketId = `TKT-${nextId}`;
        await Ticket.create({
          ticket_id: newTicketId,
          inverter_id: dbId,
          assigned_role: actionRequired === "Repair" ? "Engineer" : "Cleaner",
          status: "Open",
          issue_summary: predictionDoc.genai_context_string,
          created_at: new Date(),
          resolved_at: null
        });
        logger.info(`Ticket created -> ${newTicketId} for ${dbId}`);
      }

      // collect entry for telemetry batch (store raw row inside batch)
      batchInverters.push({
        inverter_id: dbId,
        risk_score: Number(risk.toFixed(4)),
        status,
        action_required: actionRequired,
        prediction_id: predictionDoc._id,
        raw_row: row
      });

      // advance pointer & prepare response item (compact)
      inverterPointers[inverter_id]++;
      results.push({
        inverter_id: dbId,
        risk_score: Number(risk.toFixed(4)),
        status
      });
    } // end for loop

    // store the whole snapshot (batch) as single document if we processed any inverters
    if (batchInverters.length > 0) {
      try {
        const batchDoc = await TelemetryBatch.create({
          timestamp: new Date(),
          inverters: batchInverters,
          created_at: new Date(),
          source: "csv"
        });
        logger.info(`Saved telemetry batch (id: ${batchDoc._id}) with ${batchInverters.length} inverters`);
      } catch (batchErr) {
        logger.error(`Failed saving telemetry batch: ${batchErr.message || batchErr}`);
      }
    }

    logger.info("Prediction cycle completed successfully");
    return res.json(results);
  } catch (err) {
    logger.error(`Prediction controller error: ${err && err.message ? err.message : err}`);
    return res.status(500).json({ message: "Prediction failed" });
  }
};