const mongoose = require("mongoose");

const inverterSchema = new mongoose.Schema({

  inverter_id: {
    type: String,
    required: true,
    unique: true
  },

  location: {
    type: String,
    enum: ["Block A", "Block B", "Block C"],
    required: true
  },

  current_status: {
    type: String,
    enum: ["Healthy", "Needs Cleaning", "Needs Repair"],
    default: "Healthy"
  },

  latest_prediction: {

    prediction_window: {
      type: String
    },

    risk_score: {
      type: Number
    },

    genai_context_string: {
      type: String
    },

    top_features: {
      power: Number,
      temperature: Number,
      efficiency: Number
    }

  },

  last_updated: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Inverter", inverterSchema);