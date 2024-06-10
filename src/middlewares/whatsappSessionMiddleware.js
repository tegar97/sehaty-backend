const jwt = require("jsonwebtoken");
require("dotenv").config();

const auth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({
      status: "error",
      message: "authorization denied",
      error: "No token, authorization denied",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.signKey = decoded.signKey;
    next();
  } catch (err) {
    res.status(401).json({
      status : "error",
      message: "Token is not valid",
      error : err.message
    });
  }
};

module.exports = auth;
