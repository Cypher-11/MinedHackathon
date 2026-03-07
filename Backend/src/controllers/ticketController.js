const Ticket = require("../models/Ticket");
const logger = require("../utils/logger");


/*
GET ALL TICKETS
/api/getTickets
*/

exports.getTickets = async (req, res) => {

  try {
    logger.info("Fetching all tickets");
    const tickets = await Ticket.find().sort({ created_at: -1 });
    res.json(tickets);

  } catch (error) {
    logger.error("Error fetching tickets: " + error.message);

    res.status(500).json({
      message: "Failed to fetch tickets"
    });

  }

};



/*
GENERATE NEXT TICKET ID
/api/getNextTicketId
*/

exports.getNextTicketId = async (req, res) => {

  try {

    logger.info("Generating next ticket id");

    const count = await Ticket.countDocuments();

    const nextId = count + 1;

    const ticketId = `TKT-${nextId}`;

    res.json({
      ticket_id: ticketId
    });

  } catch (error) {

    logger.error("Error generating ticket id: " + error.message);

    res.status(500).json({
      message: "Failed to generate ticket id"
    });

  }

};

/*
CREATE NEW TICKET
POST /api/createTicket
*/

exports.createTicket = async (req, res) => {

  try {

    logger.info("Create ticket request received");

    const {
      ticket_id,
      inverter_id,
      assigned_role,
      status,
      issue_summary
    } = req.body;


    const newTicket = new Ticket({

      ticket_id,
      inverter_id,
      assigned_role,
      status,
      issue_summary,

      created_at: new Date(),
      resolved_at: null

    });


    const savedTicket = await newTicket.save();

    logger.info(`Ticket created successfully: ${ticket_id}`);

    res.status(201).json({
      message: "Ticket created successfully",
      ticket: savedTicket
    });

  } catch (error) {

    logger.error("Error creating ticket: " + error.message);

    res.status(500).json({
      message: "Failed to create ticket"
    });

  }

};

/*
RESOLVE TICKET
PATCH /api/resolveTicket
*/

exports.resolveTicket = async (req, res) => {

  try {

    logger.info("Resolve ticket request received");

    const { ticket_id } = req.body;

    const ticket = await Ticket.findOneAndUpdate(

      { ticket_id: ticket_id },

      {
        $set: {
          status: "Resolved",
          resolved_at: new Date()
        }
      },

      { new: true }

    );

    if (!ticket) {

      return res.status(404).json({
        message: "Ticket not found"
      });

    }

    logger.info(`Ticket resolved: ${ticket_id}`);

    res.json({
      message: "Ticket resolved successfully",
      ticket
    });

  } catch (error) {

    logger.error("Error resolving ticket: " + error.message);

    res.status(500).json({
      message: "Failed to resolve ticket"
    });

  }

};

/*
ESCALATE TICKET
PATCH /api/escalateTicket
Cleaner → Engineer
*/

exports.escalateTicket = async (req, res) => {

  try {

    logger.info("Escalate ticket request received");

    const { ticket_id } = req.body;

    const ticket = await Ticket.findOneAndUpdate(

      { ticket_id: ticket_id },

      {
        $set: {
          status: "Escalated",
          assigned_role: "Engineer"
        }
      },

      { new: true }

    );

    if (!ticket) {

      return res.status(404).json({
        message: "Ticket not found"
      });

    }

    logger.info(`Ticket escalated to engineer: ${ticket_id}`);

    res.json({
      message: "Ticket escalated successfully",
      ticket
    });

  } catch (error) {

    logger.error("Error escalating ticket: " + error.message);

    res.status(500).json({
      message: "Failed to escalate ticket"
    });
  }
};