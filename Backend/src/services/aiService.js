// src/services/aiService.js
const fetch = global.fetch || require("node-fetch");
const logger = require("../utils/logger");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2"; // configurable

if (!OPENROUTER_API_KEY) {
  logger.error("OPENROUTER_API_KEY not set in environment");
}

/**
 * create a compact context from telemetry rows.
 * We include only the most relevant numeric/text fields.
 */
function buildContext(telemetryRows) {
  return telemetryRows.map((r) => {
    // accept that the DB doc has csv_data inside
    const csv = r.csv_data || {};
    return {
      inverter_id: r.inverter_id,
      risk_score: r.risk_score,
      status: r.status,
      power: csv.power !== undefined ? Number(csv.power) : null,
      efficiency: csv.efficiency !== undefined ? Number(csv.efficiency) : null,
      temp: csv.temp !== undefined ? Number(csv.temp) : null,
      temp_delta: csv.temp_delta !== undefined ? Number(csv.temp_delta) : null,
      string_mean: csv.string_mean !== undefined ? Number(csv.string_mean) : null,
      string_std: csv.string_std !== undefined ? Number(csv.string_std) : null,
      string_min: csv.string_min !== undefined ? Number(csv.string_min) : null,
      string_max: csv.string_max !== undefined ? Number(csv.string_max) : null,
      grid_freq: csv.grid_freq !== undefined ? Number(csv.grid_freq) : null,
      fail_next_7_days: csv.fail_next_7_days ?? csv.fail_next7 ?? null
    };
  });
}

/**
 * askAI(question, telemetryRows)
 * - telemetryRows: array of telemetry docs (from Telemetry.find().lean())
 *
 * returns assistant text or throws error.
 */
async function askAI(question, telemetryRows = []) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY missing");

  const compactContext = buildContext(telemetryRows);

  const systemPrompt = `You are a solar-plant assistant. Use the provided CONTEXT to answer user questions. Be concise and actionable. If user asks for counts or lists, return JSON only when asked.`;

  const userContent = `CONTEXT_JSON:\n${JSON.stringify(compactContext)}\n\nQUESTION:\n${question}\n\nAnswer succinctly.`;

  const body = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ]
  };

  const url = "https://openrouter.ai/api/v1/chat/completions";

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const json = await resp.json();

    if (!resp.ok) {
      logger.error("AI service error:", json);
      throw new Error(json?.error?.message || JSON.stringify(json));
    }

    // response shape: choices[0].message.content
    const content = json?.choices?.[0]?.message?.content;
    return content || JSON.stringify(json);
  } catch (err) {
    logger.error("askAI error: " + (err?.message || err));
    throw err;
  }
}

module.exports = { askAI };