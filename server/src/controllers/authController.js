const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  const user = await User.findOne({ username });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: "Invalid username or password" });
  }

  return res.json({
    success: true,
    message: "Login successful",
    data: {
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    }
  });
};

const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
};

module.exports = { login, getProfile };
