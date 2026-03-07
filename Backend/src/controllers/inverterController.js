const Inverter = require("../models/Inverter");
const logger = require("../utils/logger");

exports.addInverter = async (req, res) => {

  try {

    logger.info("Request received to add inverter");
    const { inverter_id, location, current_status } = req.body;
    const inverter = await Inverter.create({
      inverter_id,
      location,
      current_status
    });

    logger.info(`Inverter ${inverter_id} added successfully`);
    res.status(201).json({
      message: "Inverter added successfully",
      inverter
    });

  } catch (error) {

    logger.error(error.message);
    res.status(500).json({
      message: "Error adding inverter"
    });
  }

};



exports.getAllInverters = async (req, res) => {

  try {
    logger.info("Request received to fetch all inverters");
    const inverters = await Inverter.find();
    res.json(inverters);

  } catch (error) {
    logger.error(error.message);
    res.status(500).json({
      message: "Error fetching inverters"
    });
  }
};



exports.deleteInverter = async (req, res) => {

  try {
    logger.info("Request received to delete inverter");
    const { id } = req.params;
    const inverter = await Inverter.findByIdAndDelete(id);

    if (!inverter) {
      return res.status(404).json({
        message: "Inverter not found"
      });
    }

    logger.info(`Inverter ${inverter.inverter_id} deleted successfully`);

    res.json({
      message: "Inverter deleted successfully"
    });

  } catch (error) {
    logger.error(error.message);
    res.status(500).json({
      message: "Error deleting inverter"
    });
  }
};