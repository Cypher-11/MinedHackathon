const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({

  ticket_id: {
    type: String,
    required: true,
    unique: true
  },

  inverter_id: {
    type: String,
    required: true
  },

  assigned_role: {
    type: String,
    enum: ["Cleaner", "Engineer"],
    required: true
  },

  status: {
    type: String,
    enum: ["Open", "In Progress", "Escalated", "Resolved"],
    default: "Open"
  },

  issue_summary: {
    type: String
  },

  created_at: {
    type: Date,
    default: Date.now
  },

  resolved_at: {
    type: Date,
    default: null
  }

});

module.exports = mongoose.model("Ticket", ticketSchema);