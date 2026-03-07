const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({

  inverter_id: String,

  timestamp: {
    type: Date,
    default: Date.now
  },

  prediction_window: String,

  risk_score: Number,

  action_required: String,

  top_features: {
    power: Number,
    efficiency: Number,
    temp_delta: Number
  },

  genai_context_string: String,

  raw_ml_response: Object

});

module.exports = mongoose.model("Prediction", predictionSchema);