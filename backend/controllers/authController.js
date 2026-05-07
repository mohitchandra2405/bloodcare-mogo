const User = require("../models/User");

const supportedRoles = new Set(["donor", "hospital", "admin"]);

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  organization: user.organization || null,
});

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Email, password, and role are required.",
      });
    }

    const normalizedRole = String(role).toLowerCase();
    if (!supportedRoles.has(normalizedRole)) {
      return res.status(400).json({
        message: "Unsupported role selected.",
      });
    }

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      password,
      role: normalizedRole,
    }).lean();

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials for the selected role.",
      });
    }

    return res.json({
      message: "Login successful.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to complete login right now.",
    });
  }
};

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const normalizedEmail = String(email).toLowerCase();
    const normalizedRole =
      supportedRoles.has(String(role).toLowerCase()) && String(role).toLowerCase() !== "admin"
        ? String(role).toLowerCase()
        : "donor";

    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      id: `${normalizedRole}-${Date.now()}`,
      name,
      email: normalizedEmail,
      password,
      role: normalizedRole,
      organization: normalizedRole === "hospital" ? `${name} Blood Desk` : null,
    });

    return res.status(201).json({
      message: "Account created successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Unable to create the account right now.",
    });
  }
};

module.exports = {
  login,
  signup,
};
