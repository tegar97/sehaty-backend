// controllers/userController.js
const User = require("../models/user");
const UniqueCode = require("../models/telegramToken");
const crypto = require("crypto");

const generateUniqueCode = async (req, res) => {
  const userId = req.user.id;

  const code = crypto.randomBytes(4).toString("hex");
  const expiryDate = new Date();
  expiryDate.setMinutes(expiryDate.getMinutes() + 10); // Kode kadaluarsa dalam 10 menit

  const uniqueCode = new UniqueCode({
    code,
    userId,
    expiryDate,
  });

  await uniqueCode.save();

  res.json({ code });
};

// validate unique code and get user data

const validateUniqueCode = async (req, res) => {
  // get code from parameter
  const { code } = req.query;

  const uniqueCode = await UniqueCode.findOne({ code });

  if (!uniqueCode) {
    return res.status(404).json({ msg: "Invalid code" });
  }

  if (uniqueCode.expiryDate < new Date()) {
    return res.status(400).json({ msg: "Code expired" });
  }

  // get user and select only name and email
  const user = await User.findById(uniqueCode.userId).select("name email");
  res.json(user);
};

// API untuk check session
const checkSession = async (req, res) => {
  const { userNumber } = req.query;

  const token = await WhatsappUserToken.findOne({ userNumber, isLinked: true });

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
module.exports = { generateUniqueCode, validateUniqueCode };
