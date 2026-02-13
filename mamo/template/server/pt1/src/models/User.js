const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    // Two-factor authentication fields
    twoFactorSecret: {
      type: String,
      default: null,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    // Account security fields
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    // Activity tracking
    activityLog: [
      {
        action: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        ipAddress: String,
        userAgent: String,
      },
    ],
    // User preferences
    preferences: {
      // Newsletter subscription
      newsletter: {
        type: Boolean,
        default: true,
      },
      // Marketing emails
      marketing: {
        type: Boolean,
        default: true,
      },
      // Account activity notifications
      accountActivity: {
        type: Boolean,
        default: true,
      },
    },
    // Remember me token for persistent login
    rememberMeToken: {
      type: String,
      default: null,
    },
    // Refresh token for JWT authentication
    refreshToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  // Only hash the password if it has been modified or is new
  if (!user.isModified("password")) return next();

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);

    // Hash password
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  // If we have a previous lock that has expired, reset the count
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = null;
  } else {
    // Otherwise increment login attempts
    this.loginAttempts += 1;

    // Lock the account if we've reached max attempts (5)
    if (this.loginAttempts >= 5) {
      // Lock account for 30 minutes
      this.lockUntil = Date.now() + 30 * 60 * 1000;
    }
  }

  return this.save();
};

// Method to check if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Method to log user activity
userSchema.methods.logActivity = function (action, ipAddress, userAgent) {
  this.activityLog.push({
    action,
    timestamp: Date.now(),
    ipAddress,
    userAgent,
  });

  // Keep only the last 20 activities
  if (this.activityLog.length > 20) {
    this.activityLog = this.activityLog.slice(-20);
  }

  // Return this instead of saving to avoid parallel save errors
  // Caller is responsible for saving the document
  return this;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
