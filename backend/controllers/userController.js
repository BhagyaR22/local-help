const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function publicUser(user, includeContactNumber = false) {
  const result = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    name: user.name,
    email: user.email,
    reputation: user.reputation,
    reputationCount: user.reputationCount || 0,
  };
  if (includeContactNumber) result.contactNumber = user.contactNumber;
  return result;
}

const registerUser = async (req, res) => {
  try {
    const firstName = typeof req.body.firstName === "string" ? req.body.firstName.trim() : "";
    const lastName = typeof req.body.lastName === "string" ? req.body.lastName.trim() : "";
    const username = typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const rawContactNumber = typeof req.body.contactNumber === "string" ? req.body.contactNumber.trim() : "";
    const contactNumber = rawContactNumber.replace(/[\s().-]/g, "");
    const password = req.body.password;

    if (!firstName || !lastName || !username || !email || !contactNumber || !password) {
      return res.status(400).json({ message: "First name, last name, username, contact number, email, and password are required" });
    }
    if (firstName.length > 50 || lastName.length > 50) {
      return res.status(400).json({ message: "Names must be 50 characters or fewer" });
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ message: "Username must be 3–20 characters using letters, numbers, or underscores" });
    }
    const phoneDigits = contactNumber.replace(/\D/g, "");
    if (!/^\+?[0-9]{7,15}$/.test(contactNumber) || phoneDigits.length < 7 || phoneDigits.length > 15) {
      return res.status(400).json({ message: "Enter a valid contact number with 7–15 digits" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: "Email already registered" });
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(409).json({ message: "Username is already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      username,
      name: `${firstName} ${lastName}`,
      contactNumber,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully", user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({ message: field === "username" ? "Username is already taken" : "Email already registered" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token, user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: publicUser(user, true) });
  } catch (error) {
    res.status(500).json({ message: "Failed to get profile", error: error.message });
  }
};

module.exports = { registerUser, loginUser, getProfile };
