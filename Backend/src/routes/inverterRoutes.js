const express = require("express");

const router = express.Router();

const inverterController = require("../controllers/inverterController");

const authMiddleware = require("../middleware/authMiddleware");


// Add inverter
// for authorizatiion add the authMiddleware in between the / and inverterController
router.post("/",inverterController.addInverter);


// Get all inverters
// for authorizatiion add the authMiddleware in between the / and inverterController
router.get("/",inverterController.getAllInverters);


// Delete inverter
// for authorizatiion add the authMiddleware in between the / and inverterController
router.delete("/:id",inverterController.deleteInverter);


module.exports = router;