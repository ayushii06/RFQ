import User from "../models/userModel.js";

// @desc    Sync or Create User profile from Clerk authentication data
// @route   POST /api/users/sync
// @access  Public (Called right after frontend Clerk session instantiation)
export const syncUser = async (req, res) => {
  const { clerkUserId, name, email, role } = req.body;

  try {
    if (!clerkUserId || !email) {
      return res.status(400).json({ message: "Clerk User ID and Email are required." });
    }

    // Attempt finding local identity by Clerk string or Email
    let user = await User.findOne({
      $or: [{ clerkUserId }, { email }],
    });

    if (user) {
      // Update attributes in case name or roles were amended
      user.clerkUserId = clerkUserId;
      user.name = name || user.name;
      if (role) user.role = role;
      await user.save();
    } else {
      user = await User.create({
        clerkUserId,
        name: name || email.split("@")[0],
        email,
        role: role || "supplier",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in syncUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};
