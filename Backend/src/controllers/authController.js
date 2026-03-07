const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");


exports.register = async (req, res) => {

  try {

    logger.info("Registration request received");

    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {

      logger.info(`Registration failed - User already exists: ${email}`);

      return res.status(400).json({
        message: "User already exists"
      });

    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    logger.info(`User registered successfully: ${email}`);

    res.status(201).json({
      message: "User registered successfully",
      user
    });

  } catch (error) {

    logger.error(`Registration error: ${error.message}`);

    res.status(500).json({
      message: "Server error during registration"
    });

  }

};



exports.login = async (req, res) => {

  try {

    logger.info("Login request received");

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {

      logger.info(`Login failed - user not found: ${email}`);

      return res.status(400).json({
        message: "Invalid email"
      });

    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {

      logger.info(`Login failed - incorrect password: ${email}`);

      return res.status(400).json({
        message: "Invalid password"
      });

    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    logger.info(`Login successful for user: ${email}`);

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      name: user.name
    });

  } catch (error) {

    logger.error(`Login error: ${error.message}`);

    res.status(500).json({
      message: "Server error during login"
    });
  }
};