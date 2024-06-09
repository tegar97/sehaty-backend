const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const RefreshToken = require("../models/refreshToken");
require("dotenv").config();

const generateAccessToken = (user) => {
  return jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const generateRefreshToken = async (user) => {
  const refreshToken = jwt.sign(
    { user: { id: user.id } },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION }
  );

  const expiryDate = new Date();
  expiryDate.setDate(
    expiryDate.getDate() + parseInt(process.env.REFRESH_TOKEN_EXPIRATION)
  );

  await new RefreshToken({
    token: refreshToken,
    userId: user.id,
    expiryDate,
  }).save();

  return refreshToken;
};

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    user = new User({
      name,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

const refresh = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ msg: "No token provided" });
  }

  console.log(token)
 
  try {
    console.log('Received refresh token:', token);
    const existingToken = await RefreshToken.findOne({ token });
    console.log('Existing token:', existingToken);

    if (!existingToken) {
      console.log('Refresh token not found in database');
      return res.status(403).json({ msg: 'Invalid refresh token' });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    console.log('Decoded token:', decoded);

    const newAccessToken = generateAccessToken(decoded.user);
    const newRefreshToken = await generateRefreshToken(decoded.user);

    await existingToken.remove();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err.message);
    res.status(403).json({ msg: 'Invalid refresh token' });
  }
};

module.exports = { register, login, refresh };
