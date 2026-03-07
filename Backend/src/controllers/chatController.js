const TelemetryBatch = require("../models/TelemetryBatch");
const logger = require("../utils/logger");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const MODEL = "deepseek/deepseek-v3.2";

function buildContext(inverters) {
	return inverters.map((inv) => {
		const row = inv.raw_row || {};

		return {
			inverter_id: inv.inverter_id,
			risk_score: inv.risk_score,
			status: inv.status,

			timestamp: row.timestamp || null,
			power: row.power ? Number(row.power) : null,
			efficiency: row.efficiency ? Number(row.efficiency) : null,
			temp_delta: row.temp_delta ? Number(row.temp_delta) : null,
			string_mean: row.string_mean ? Number(row.string_mean) : null,
			grid_freq: row.grid_freq ? Number(row.grid_freq) : null,
			irradiation: row.irradiation ? Number(row.irradiation) : null,
			module_temp: row.module_temp ? Number(row.module_temp) : null,
		};
	});
}

exports.chatWithInverters = async (req, res) => {
	try {
		const { question, inverters } = req.body || {};

		if (!question) {
			return res.status(400).json({
				error: "question is required",
			});
		}

		let inverterContext = [];

		if (Array.isArray(inverters) && inverters.length > 0) {
			inverterContext = inverters.map((inv) => ({
				inverter_id: inv.inverter_id,
				risk_score: inv.risk_score,
				status: inv.status,
				raw_row: inv.raw_row || {},
			}));
		} else {

			const latestBatch = await TelemetryBatch.findOne()
				.sort({ created_at: -1 })
				.lean();

			if (!latestBatch) {
				return res.status(400).json({
					error: "No telemetry data available",
				});
			}

			inverterContext = latestBatch.inverters;
		}

		const context = buildContext(inverterContext);

		const systemPrompt = `
You are an AI assistant monitoring a solar farm with 12 inverters.
you should strictly strictly and strictly answer the question around
the domain of the received telemetry data or question regarding solar inverter related
question or questions regarding inverters you should not answer questions which are not related to solar inverters
or its telemetry data features if you get asked about it then reply that this question 
is out of my domain and this is strict requirement and an important need for you to
fulfill as an ai agent

You will receive telemetry data for the inverters including:
- inverter_id
- risk_score
- status
- power
- efficiency
- temperature values
- other electrical parameters

You must analyze this data and answer questions about:

• inverter health
• system anomalies
• risk trends
• maintenance recommendations
• comparisons between inverters

Always answer clearly and based strictly on the provided data.
`;

		const userPrompt = `
Telemetry Data:
${JSON.stringify(context)}

User Question:
${question}
`;

		const response = await fetch(
			"https://openrouter.ai/api/v1/chat/completions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${OPENROUTER_API_KEY}`,
					"Content-Type": "application/json",
					"HTTP-Referer": "http://localhost:3000",
					"X-Title": "Inverter AI Assistant",
				},
				body: JSON.stringify({
					model: MODEL,
					messages: [
						{ role: "system", content: systemPrompt },
						{ role: "user", content: userPrompt },
					],
				}),
			},
		);

		const data = await response.json();

		if (!data.choices || data.choices.length === 0) {
			logger.error("AI returned empty response");

			return res.status(500).json({
				error: "AI returned empty response",
				details: data,
			});
		}

		const answer = data.choices[0].message.content;

		return res.json({
			answer,
		});
	} catch (err) {
		logger.error("Chat controller error:", err);

		return res.status(500).json({
			error: "AI request failed",
			details: err.message,
		});
	}
};
