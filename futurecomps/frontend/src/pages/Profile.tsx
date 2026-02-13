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
  Settings,
  ShoppingBag,
  Package,
  ArrowLeft,
  Heart,
  CreditCard,
  MapPin,
  Calendar,
  Star,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { profileAPI } from "../services/api";
import ImageUpload from "../components/ImageUpload";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
  }
};

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');

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
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="relative">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full" />
          <div className="absolute inset-0 animate-ping w-12 h-12 border-4 border-blue-400/20 rounded-full" />
        </div>
      </div>
    );
  }

  const quickStats = [
    { label: "Orders", value: "12", icon: Package, color: "blue" },
    { label: "Wishlist", value: "8", icon: Heart, color: "rose" },
    { label: "Reviews", value: "5", icon: Star, color: "amber" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Simpler Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link 
              to="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Home</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Left Sidebar - Profile Card */}
          <motion.div variants={itemVariants} className="lg:col-span-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Simple Profile Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold text-white">
                        {user.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {editing && (
                      <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {user.name}
                    {user.isVerified && (
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    )}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{user.email}</p>

                  {/* Simple Badges */}
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium ${
                        user.isVerified
                          ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                      }`}
                    >
                      {user.isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {user.isVerified ? "Verified" : "Not Verified"}
                    </span>
                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                        <Shield className="w-3.5 h-3.5" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-6 grid grid-cols-3 gap-4">
                {quickStats.map((stat) => (
                  <div 
                    key={stat.label}
                    className="text-center"
                  >
                    <stat.icon className={`w-5 h-5 mx-auto mb-1 ${
                      stat.color === 'blue' ? 'text-blue-500' :
                      stat.color === 'rose' ? 'text-rose-500' :
                      'text-amber-500'
                    }`} />
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right Content */}
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-800/50 rounded-2xl flex items-start gap-3"
                >
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-400">Error</p>
                    <p className="text-red-600 dark:text-red-400 text-sm mt-0.5">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-2xl flex items-start gap-3"
                >
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700 dark:text-emerald-400">Success</p>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{success}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-1.5 border border-white/50 dark:border-gray-800/50 shadow-lg shadow-gray-900/5 dark:shadow-none">
              <div className="flex gap-1">
                {['overview', 'activity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as 'overview' | 'activity')}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Card */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-900/5 dark:shadow-none border border-white/50 dark:border-gray-800/50 overflow-hidden">
              {activeTab === 'overview' && (
                <div className="p-6 sm:p-8">
                  {!editing ? (
                    <>
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Personal Information
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Your account details and contact information
                          </p>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setEditing(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit Profile</span>
                        </motion.button>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="group relative p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/30 hover:border-blue-200 dark:hover:border-blue-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">Full Name</p>
                              <p className="mt-1 font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative p-5 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/30 hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
                              <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Email Address</p>
                              <p className="mt-1 font-semibold text-gray-900 dark:text-white truncate">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative p-5 bg-gradient-to-br from-violet-50/80 to-purple-50/50 dark:from-violet-900/20 dark:to-purple-900/10 rounded-2xl border border-violet-100/50 dark:border-violet-800/30 hover:border-violet-200 dark:hover:border-violet-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl shadow-lg shadow-violet-500/25">
                              <Phone className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-violet-600/70 dark:text-violet-400/70 uppercase tracking-wider">Phone Number</p>
                              <p className={`mt-1 font-semibold truncate ${user.phone ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                {user.phone || "Not set"}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative p-5 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-2xl border border-amber-100/50 dark:border-amber-800/30 hover:border-amber-200 dark:hover:border-amber-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/25">
                              <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">Bio</p>
                              <p className={`mt-1 font-semibold truncate ${user.bio ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
                                {user.bio || "No bio added"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Security Actions */}
                      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Security & Access</h4>
                        <div className="flex flex-wrap gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate("/change-password")}
                            className="flex items-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                          >
                            <Lock className="w-4 h-4" />
                            Change Password
                          </motion.button>
                          {user.role === "admin" && (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate("/admin")}
                              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-violet-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30"
                            >
                              <Settings className="w-4 h-4" />
                              Admin Dashboard
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Edit Form */
                    <form onSubmit={handleUpdate} className="space-y-6">
                      {/* Section Header */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-blue-500" />
                          Edit Your Profile
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          Update your personal information
                        </p>
                      </div>

                      {/* Avatar Upload */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          Profile Picture
                        </label>
                        <ImageUpload
                          currentImage={formData.avatar}
                          onUploadSuccess={(url) => {
                            setFormData({ ...formData, avatar: url });
                            setSuccess("Image uploaded successfully!");
                          }}
                          onUploadError={() => {
                            setError("Failed to upload image");
                          }}
                          folder="/avatars"
                        />
                      </div>

                      {/* Name Field */}
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Full Name
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            id="name"
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      {/* Phone Field */}
                      <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Phone Number
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                            <Phone className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      {/* Bio Field */}
                      <div className="space-y-2">
                        <label htmlFor="bio" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Bio
                        </label>
                        <div className="relative group">
                          <div className="absolute top-4 left-4 pointer-events-none">
                            <FileText className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <textarea
                            id="bio"
                            rows={4}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-blue-500 dark:focus:border-blue-400 transition-all resize-none"
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
                          className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              <span>Saving Changes...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-5 h-5" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={() => setEditing(false)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-6 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                        >
                          Cancel
                        </motion.button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className="p-6 sm:p-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: ShoppingBag, text: "Placed order #12345", time: "2 hours ago", color: "blue" },
                      { icon: Heart, text: "Added iPhone 15 Pro to wishlist", time: "1 day ago", color: "rose" },
                      { icon: Star, text: "Reviewed MacBook Pro M3", time: "3 days ago", color: "amber" },
                      { icon: CreditCard, text: "Updated payment method", time: "1 week ago", color: "emerald" },
                    ].map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors group"
                      >
                        <div className={`p-2.5 rounded-xl ${
                          activity.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                          activity.color === 'rose' ? 'bg-rose-100 dark:bg-rose-900/30' :
                          activity.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30' :
                          'bg-emerald-100 dark:bg-emerald-900/30'
                        }`}>
                          <activity.icon className={`w-5 h-5 ${
                            activity.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                            activity.color === 'rose' ? 'text-rose-600 dark:text-rose-400' :
                            activity.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                            'text-emerald-600 dark:text-emerald-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{activity.text}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { 
                  title: "Continue Shopping", 
                  description: "Browse our latest products", 
                  icon: ShoppingBag, 
                  color: "blue",
                  gradient: "from-blue-500 to-indigo-500",
                  link: "/shop"
                },
                { 
                  title: "My Orders", 
                  description: "Track your order status", 
                  icon: Package, 
                  color: "emerald",
                  gradient: "from-emerald-500 to-teal-500",
                  link: "/orders"
                },
                { 
                  title: "Saved Addresses", 
                  description: "Manage delivery locations", 
                  icon: MapPin, 
                  color: "violet",
                  gradient: "from-violet-500 to-purple-500",
                  link: "/addresses"
                },
                { 
                  title: "Payment Methods", 
                  description: "Manage your cards", 
                  icon: CreditCard, 
                  color: "amber",
                  gradient: "from-amber-500 to-orange-500",
                  link: "/payments"
                },
                { 
                  title: "Wishlist", 
                  description: "Your saved items", 
                  icon: Heart, 
                  color: "rose",
                  gradient: "from-rose-500 to-pink-500",
                  link: "/wishlist"
                },
                { 
                  title: "Settings", 
                  description: "Manage preferences", 
                  icon: Settings, 
                  color: "slate",
                  gradient: "from-slate-500 to-gray-500",
                  link: "/settings"
                },
              ].map((action, index) => (
                <Link to={action.link} key={index}>
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-900/5 dark:shadow-none border border-white/50 dark:border-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-300 overflow-hidden cursor-pointer"
                  >
                    {/* Hover gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    
                    <div className="relative flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-lg`}>
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer spacing */}
      <div className="h-8" />
    </div>
  );
}
