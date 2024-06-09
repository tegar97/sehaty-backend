const jwt = require("jsonwebtoken");
const whatsappToken = require("../models/whatsappToken");

exports.generateWhatsappCode = async (req, res) => {
  try {
    // Generate JWT
    const { signKey } = req.body;

    const code = jwt.sign({ signKey }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });

    //validation
    // 1. if signKey is not provided
    if (!signKey) {
      return res.status(400).json({ message: "signKey is required" });
    }

    //2 if signkey exists in the database
    const token = await whatsappToken.findOne({ signkey: signKey });
    if (token) {
      if (token.isLinked === true) {
        return res.status(400).json({
          message: "This number/phone already linked with WhatsApp service",
        });
      } else {
        // Delete the token
        const deletedToken = await whatsappToken.findOneAndDelete({
          signkey: signKey,
        });
        if (!deletedToken) {
          return res.status(500).json({
            message: "Failed to delete the token",
          });
        }
      }
    }

    // Save code to database
    const newToken = new whatsappToken({
      code,
      signkey: signKey,
      isLinked: false,

      sessionStartedAt: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Jakarta",
      }),
    });
    await newToken.save();

    res.status(200).json({
      message: "Whatsapp code generated successfully",
      accessCode: code,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.startWhatsappSession = async (req, res) => {
  try {
    const { code, userNumber } = req.body;

    // Find the token by code
    const token = await whatsappToken.findOne({ code });
    if (!token) {
      return res.status(404).json({ message: "Invalid code" });
    }

    // Update userNumber and isLinked
    token.userNumber = userNumber;
    token.isLinked = true;
    await token.save();

    res.status(200).json({ message: "Session started successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// API untuk check session
exports.checkSession = async (req, res) => {
  const signKey = req.signKey;

  const token = await whatsappToken.findOne({
    signkey: signKey,
    isLinked: true,
  });

  if (!token) {
    return res
      .status(404)
      .json({ message: "No active session found for this user number" });
  }

  res.status(200).json({
    message: "Session is active",
    userNumber: token.userNumber,
    code: token.code,
  });
};
