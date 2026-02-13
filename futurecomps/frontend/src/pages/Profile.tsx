import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  FileText,
  LogOut,
  Edit3,
  Shield,
  Lock,
  AlertCircle,
  CheckCircle2,
  Camera,
  ArrowLeft,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profileAPI } from "../services/api";
import ImageUpload from "../components/ImageUpload";

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await profileAPI.updateProfile(formData);
      setUser(response.data.user);
      setSuccess("Profile updated successfully!");
      setEditing(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-12 h-12 border-4 border-neutral-900/20 border-t-neutral-900 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Header with avatar */}
            <div className="p-6 sm:p-8 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center text-2xl font-bold text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {editing && (
                      <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-neutral-900 hover:bg-neutral-800 rounded-full flex items-center justify-center text-white shadow-lg transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      {user.name}
                      {user.isVerified && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">{user.email}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {user.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Not Verified
                        </span>
                      )}
                      {user.role === "admin" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          <Shield className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!editing && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Profile Details/Edit Form */}
            <div className="p-6 sm:p-8">
              {!editing ? (
                // View Mode
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <User className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">
                            Full Name
                          </p>
                          <p className="text-gray-900 font-medium mt-1">
                            {user.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">
                            Email Address
                          </p>
                          <p className="text-gray-900 font-medium mt-1">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">
                            Phone Number
                          </p>
                          <p
                            className={`font-medium mt-1 ${user.phone ? "text-gray-900" : "text-gray-400 italic"}`}
                          >
                            {user.phone || "Not set"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">
                            Bio
                          </p>
                          <p
                            className={`font-medium mt-1 ${user.bio ? "text-gray-900" : "text-gray-400 italic"}`}
                          >
                            {user.bio || "No bio added"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Actions */}
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">
                      Security
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/change-password")}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-medium rounded-lg transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        Change Password
                      </motion.button>
                      {user.role === "admin" && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate("/admin")}
                          className="flex items-center gap-2 px-4 py-2.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-sm font-medium rounded-lg transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Dashboard
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleUpdate} className="space-y-6">
                  {/* Avatar Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Profile Picture
                    </label>
                    <ImageUpload
                      currentImage={formData.avatar}
                      onUploadSuccess={(url) => {
                        setFormData({ ...formData, avatar: url });
                        setSuccess("Image uploaded!");
                        setTimeout(() => setSuccess(""), 2000);
                      }}
                      onUploadError={() => {
                        setError("Failed to upload image");
                        setTimeout(() => setError(""), 2000);
                      }}
                      folder="/avatars"
                    />
                  </div>

                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-neutral-900 transition-colors"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone Field */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-neutral-900 transition-colors"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  {/* Bio Field */}
                  <div>
                    <label
                      htmlFor="bio"
                      className="block text-sm font-semibold text-gray-900 mb-2"
                    >
                      Bio
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        id="bio"
                        rows={4}
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                        className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-neutral-900 transition-colors resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="animate-spin w-5 h-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: user.name || "",
                          phone: user.phone || "",
                          bio: user.bio || "",
                          avatar: user.avatar || "",
                        });
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      <span>Cancel</span>
                    </motion.button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
