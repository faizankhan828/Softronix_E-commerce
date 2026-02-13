import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Lock,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profileAPI } from "../services/api";
import ImageUpload from "../components/ImageUpload";
import ProfileSidebar from "../components/Profile/ProfileSidebar";
import OrderHistory from "../components/Profile/OrderHistory";
import Wishlist from "./Wishlist";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Manage edit mode within the settings section or globally?
  // The Sidebar controls 'activeSection'. 'Settings' is the edit section.

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
      window.location.href = "/"; // Full reload to main page as requested
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

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-8">
            {/* ... (stats stats) same as before ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-medium text-muted-foreground mb-1">
                    Account Status
                  </h3>
                  <p className="text-lg font-bold text-foreground">
                    {user.isVerified ? "Verified" : "Unverified"}
                  </p>
                </div>
                <span
                  className={`w-3 h-3 rounded-full ${user.isVerified ? "bg-green-500" : "bg-yellow-500"}`}
                />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <h3 className="text-xs font-medium text-muted-foreground mb-1">
                  Member Since
                </h3>
                <p className="text-lg font-bold text-foreground">
                  {new Date(user.createdAt || Date.now()).getFullYear()}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                <h3 className="text-xs font-medium text-muted-foreground mb-1">
                  Role
                </h3>
                <p className="text-lg font-bold text-foreground capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Personal Information</h2>
                <button
                  onClick={() => setActiveSection("settings")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Edit Details
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-medium truncate">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium truncate">
                      {user.phone || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:col-span-2">
                  <div className="p-2 bg-muted rounded-lg shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-xs text-muted-foreground">Bio</p>
                    <p className="font-medium text-sm leading-relaxed">
                      {user.bio || "No bio added"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Actions - moved here or stay in settings? Let's keep in settings or creating a separate 'security' tab if needed. 
                For now, let's put it in Settings as well or just below overview. 
                Original design had it in 'view mode'. 
            */}
          </div>
        );
      case "orders":
        return <OrderHistory />;
      case "wishlist":
        return <Wishlist />;
      case "settings":
        return (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

            <form onSubmit={handleUpdate} className="space-y-6">
              {/* Avatar Upload - Using ImageUpload's internal UI */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">
                  Profile Picture
                </label>
                <ImageUpload
                  currentImage={formData.avatar}
                  onUploadSuccess={(url) =>
                    setFormData({ ...formData, avatar: url })
                  }
                  onUploadError={() => setError("Failed to upload image")}
                  folder="/avatars"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full p-4 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-32"
                  placeholder="Tell us a little about yourself..."
                />
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
                {success && (
                  <p className="text-sm text-green-500 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {success}
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </p>
                )}
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-border">
              <h3 className="text-lg font-semibold mb-4">Security</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/change-password")}
                  className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium rounded-lg transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
                {user.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-medium rounded-lg transition-colors border border-purple-500/20"
                  >
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header - only visible on small screens to go back */}
      <header className="md:hidden bg-background border-b border-border p-4 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Store</span>
        </Link>
        <button
          onClick={handleLogout}
          className="p-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <ProfileSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
          />

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
