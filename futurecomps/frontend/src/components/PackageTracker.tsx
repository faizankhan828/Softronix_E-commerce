import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Package, 
  MapPin, 
  Truck, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Search,
  CreditCard,
  Settings,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { 
  getOrderTracking, 
  trackPackageByNumber, 
  getUserOrdersWithTracking,
  type TrackingInfo,
  type Order
} from "@/api/services/orderService";

interface PackageTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "order_placed":
      return <Package className="w-5 h-5" />;
    case "payment_confirmed":
      return <CreditCard className="w-5 h-5" />;
    case "processing":
      return <Settings className="w-5 h-5" />;
    case "shipped":
      return <Truck className="w-5 h-5" />;
    case "delivered":
      return <CheckCircle className="w-5 h-5" />;
    default:
      return <Clock className="w-5 h-5" />;
  }
};

export function PackageTracker({ isOpen, onClose }: PackageTrackerProps) {
  const { user } = useAuth();
  const [view, setView] = useState<"list" | "detail" | "search">("list");
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTracking, setSelectedTracking] = useState<TrackingInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's orders
  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserOrdersWithTracking();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      fetchOrders();
    }
  }, [isOpen, user, fetchOrders]);

  // Track specific order
  const handleTrackOrder = async (orderId: string) => {
    setLoading(true);
    setError("");
    try {
      const tracking = await getOrderTracking(orderId);
      setSelectedTracking(tracking);
      setView("detail");
    } catch (err) {
      setError("Failed to load tracking information");
    } finally {
      setLoading(false);
    }
  };

  // Search by tracking number
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError("");
    try {
      const tracking = await trackPackageByNumber(searchQuery.trim());
      setSelectedTracking(tracking);
      setView("detail");
    } catch (err) {
      setError("Tracking number not found. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh tracking
  const handleRefresh = async () => {
    if (!selectedTracking?.orderId) return;
    setRefreshing(true);
    try {
      const tracking = await getOrderTracking(selectedTracking.orderId);
      setSelectedTracking(tracking);
    } catch (err) {
      setError("Failed to refresh tracking");
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Pending";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Track Package</h2>
                  <p className="text-xs text-blue-100">Real-time delivery updates</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => { setView("list"); setError(""); }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  view === "list" 
                    ? "text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                My Orders
              </button>
              <button
                onClick={() => { setView("search"); setError(""); }}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  view === "search" 
                    ? "text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-900" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Track by Number
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Search View */}
              {view === "search" && (
                <div className="p-6">
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Enter Tracking Number
                      </label>
                      <div className="relative">
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="e.g., SFX12345678"
                          className="pr-12"
                          icon={<Search className="w-5 h-5" />}
                        />
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loading || !searchQuery.trim()}
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                        </motion.div>
                      ) : null}
                      {loading ? "Searching..." : "Track Package"}
                    </Button>
                  </form>

                  <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <h4 className="text-sm font-medium mb-2">Where to find your tracking number?</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your tracking number was sent to your email after your order was shipped. 
                      It typically starts with "SFX" followed by 8 characters.
                    </p>
                  </div>
                </div>
              )}

              {/* Orders List View */}
              {view === "list" && (
                <div className="p-4">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full"
                      />
                      <p className="mt-4 text-sm text-gray-500">Loading your orders...</p>
                    </div>
                  ) : !user ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Sign in to track orders</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Log in to see your recent orders and track their delivery status.
                      </p>
                      <Button onClick={() => window.location.href = "/auth"}>
                        Sign In
                      </Button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No orders yet</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        When you place an order, you'll be able to track it here.
                      </p>
                      <Button onClick={onClose}>
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <motion.button
                          key={order._id || order.id}
                          onClick={() => handleTrackOrder(order._id || order.id || "")}
                          className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">
                                Order #{(order._id || order.id || "").toString().slice(-8).toUpperCase()}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <Badge className={statusColors[order.status] || statusColors.pending}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                            </p>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tracking Detail View */}
              {view === "detail" && selectedTracking && (
                <div className="p-4 space-y-6">
                  {/* Back Button */}
                  <button
                    onClick={() => setView("list")}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to orders
                  </button>

                  {/* Status Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-white/20 text-white border-0">
                        {selectedTracking.carrier.toUpperCase()}
                      </Badge>
                      <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-blue-100 text-xs mb-1">Tracking Number</p>
                      <p className="font-mono font-semibold">{selectedTracking.trackingNumber}</p>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className={`p-2 rounded-full ${
                        selectedTracking.status === "delivered" 
                          ? "bg-emerald-400/20" 
                          : "bg-white/20"
                      }`}>
                        {selectedTracking.status === "delivered" ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Truck className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{selectedTracking.statusText}</p>
                        <p className="text-blue-100 text-sm">{selectedTracking.currentLocation}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedTracking.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute h-full bg-white rounded-full"
                      />
                    </div>
                    <p className="text-xs text-blue-100 mt-2 text-right">
                      {selectedTracking.progress}% complete
                    </p>
                  </motion.div>

                  {/* Estimated Delivery */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">ESTIMATED DELIVERY</p>
                        <p className="font-semibold text-amber-700 dark:text-amber-300">
                          {formatDate(selectedTracking.estimatedDelivery)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Delivery Timeline
                    </h4>
                    <div className="space-y-1">
                      {selectedTracking.timeline.map((step, index) => (
                        <motion.div
                          key={step.status}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-8 pb-6 last:pb-0"
                        >
                          {/* Timeline Line */}
                          {index < selectedTracking.timeline.length - 1 && (
                            <div className={`absolute left-[14px] top-7 w-0.5 h-full ${
                              step.completed 
                                ? "bg-blue-600" 
                                : "bg-gray-200 dark:bg-gray-700"
                            }`} />
                          )}
                          
                          {/* Timeline Dot */}
                          <div className={`absolute left-0 top-0 w-7 h-7 rounded-full flex items-center justify-center ${
                            step.completed 
                              ? step.isCurrent
                                ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50"
                                : "bg-blue-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                          }`}>
                            {getStatusIcon(step.status)}
                          </div>

                          <div className="ml-2">
                            <p className={`font-medium ${
                              step.completed ? "text-gray-900 dark:text-white" : "text-gray-400"
                            }`}>
                              {step.label}
                            </p>
                            <p className={`text-sm ${
                              step.completed ? "text-gray-500" : "text-gray-400"
                            }`}>
                              {step.description}
                            </p>
                            {step.timestamp && (
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(step.timestamp)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  {selectedTracking.shippingAddress && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Delivery Address
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>{selectedTracking.shippingAddress.name}</p>
                        <p>{selectedTracking.shippingAddress.line1}</p>
                        {selectedTracking.shippingAddress.line2 && (
                          <p>{selectedTracking.shippingAddress.line2}</p>
                        )}
                        <p>
                          {selectedTracking.shippingAddress.city}, {selectedTracking.shippingAddress.state} {selectedTracking.shippingAddress.postalCode}
                        </p>
                        <p>{selectedTracking.shippingAddress.country}</p>
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  {selectedTracking.items && selectedTracking.items.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        Package Contents
                      </h4>
                      <div className="space-y-2">
                        {selectedTracking.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-900 rounded-lg">
                            {item.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name || "Product"} 
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
