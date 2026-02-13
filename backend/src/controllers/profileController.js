import User from "../models/User.js";

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    const updatedUser = await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        isVerified: updatedUser.isVerified,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account
// @route   DELETE /api/profile
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ message: "Please provide your password to confirm deletion" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    // Delete user
    await user.deleteOne();

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user statistics
// @route   GET /api/profile/stats
// @access  Private
export const getProfileStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stats = {
      accountAge: Math.floor(
        (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
      ), // days
      isVerified: user.isVerified,
      profileComplete: calculateProfileCompleteness(user),
      lastUpdated: user.updatedAt,
    };

    res.json(stats);
  } catch (error) {
    console.error("Get profile stats error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate profile completeness
const calculateProfileCompleteness = (user) => {
  let complete = 0;
  const fields = ["name", "email", "phone", "bio", "avatar"];

  fields.forEach((field) => {
    if (user[field] && user[field] !== "") {
      complete += 20;
    }
  });

  return complete;
};
