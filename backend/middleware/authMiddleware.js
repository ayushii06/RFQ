import { getAuth } from "@clerk/express";
import User from "../models/userModel.js";

// Protect routes using Clerk's getAuth
export const protect = async (req, res, next) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Not authorized, please sign in." });
  }

  try {
    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      return res.status(401).json({ message: "User profile not synced with backend database." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Protect middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Restrict access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user ? req.user.role : "unknown"} is not authorized to access this resource`,
      });
    }
    next();
  };
};
