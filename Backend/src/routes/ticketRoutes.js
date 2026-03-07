const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

// GET ALL TICKETS
router.get("/getTickets", ticketController.getTickets);

// GET NEXT TICKET ID
router.get("/getNextTicketId", ticketController.getNextTicketId);

// CREATE TICKET
router.post("/createTicket", ticketController.createTicket);

// RESOLVE TICKET
router.patch("/resolveTicket", ticketController.resolveTicket);

// ESCALATE TICKET
router.patch("/escalateTicket", ticketController.escalateTicket);

module.exports = router;