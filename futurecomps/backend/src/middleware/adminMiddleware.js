// Admin role verification middleware
export const adminOnly = (req, res, next) => {
  try {
    // Assumes protect middleware has already run and attached user to req
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized, no user found" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Server error in admin verification" });
  }
};

// Check if user account is active
export const checkActive = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    next();
  } catch (error) {
    console.error("Active check middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
