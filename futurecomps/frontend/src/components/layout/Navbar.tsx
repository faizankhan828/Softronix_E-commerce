import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, User, Search, Truck, Heart, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { PackageTracker } from "@/components/PackageTracker";
import { cn } from "@/lib/utils";

const categories = [
  { name: "All Products", path: "/shop" },
  { name: "Electronics", path: "/shop?category=electronics" },
  { name: "Clothing", path: "/shop?category=clothing" },
  { name: "Home & Garden", path: "/shop?category=home" },
  { name: "Sports", path: "/shop?category=sports" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isTrackingOpen, setTrackingOpen] = useState(false);
  const location = useLocation();

  const { cart, setCartOpen, setFilters, wishlist } = useStore();
  const { user } = useAuth();
  const { toggleTheme, ThemeIcon } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilters({ search: searchQuery.trim() });
      setSearchOpen(false);
      setSearchQuery("");
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const cartItemsCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 w-full transition-all duration-500",
          isScrolled
            ? "bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl shadow-[0_2px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_2px_20px_-2px_rgba(0,0,0,0.3)]"
            : "bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800/50",
        )}
      >
        {/* Main Navbar */}
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Left: Mobile Menu + Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="lg:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Menu className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2">
                <Logo size="sm" />
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 bg-gray-50/80 dark:bg-gray-900/50 rounded-2xl px-2 py-1.5">
              {categories.map((category) => {
                const isActive = location.pathname + location.search === category.path;
                return (
                  <Link
                    key={category.name}
                    to={category.path}
                    className={cn(
                      "relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                      isActive
                        ? "text-white"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60",
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{category.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                aria-label="Toggle theme"
              >
                {ThemeIcon}
              </motion.button>

              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className={cn(
                  "p-2.5 rounded-xl transition-all duration-300",
                  searchOpen
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Track Package Button - Hidden on smallest screens */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTrackingOpen(true)}
                className="hidden sm:flex p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors relative group"
                aria-label="Track Package"
              >
                <Truck className="w-5 h-5" />
                <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-50">
                  Track Package
                </span>
              </motion.button>

              {/* Wishlist Button */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/wishlist"
                  className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex items-center justify-center"
                  aria-label="Wishlist"
                >
                  <Heart className="w-5 h-5" />
                  {wishlist.length > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-rose-500/30"
                    >
                      {wishlist.length > 9 ? "9+" : wishlist.length}
                    </motion.span>
                  )}
                </Link>
              </motion.div>

              {/* User Menu */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to={user ? "/profile" : "/auth"}
                  className={cn(
                    "p-2.5 rounded-xl transition-colors flex items-center justify-center",
                    user
                      ? "hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  aria-label="Account"
                >
                  <User className="w-5 h-5" />
                </Link>
              </motion.div>

              {/* Cart Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30"
                  >
                    {cartItemsCount > 9 ? "9+" : cartItemsCount}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {searchOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSearchOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                style={{ top: "72px" }}
              />
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="absolute top-full left-0 right-0 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-2xl p-4 sm:p-6 z-50"
              >
                <form
                  onSubmit={handleSearch}
                  className="container mx-auto max-w-2xl"
                >
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for products..."
                      icon={<Search className="w-5 h-5" />}
                      className="pr-24 h-12 text-base"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2"
                    >
                      Search
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["Electronics", "Clothing", "Sports", "Home"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSearchQuery(tag);
                          setSearchOpen(false);
                          window.location.href = `/shop?search=${encodeURIComponent(tag)}`;
                        }}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
                style={{ top: "64px" }}
              />
              <motion.div
                initial={{ opacity: 0, x: -300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -300 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:hidden fixed top-16 left-0 bottom-0 w-[85%] max-w-sm bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 shadow-2xl z-40 overflow-y-auto"
              >
                <nav className="p-5 space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">Categories</p>
                  {categories.map((category) => {
                    const isActive = location.pathname + location.search === category.path;
                    return (
                      <Link
                        key={category.name}
                        to={category.path}
                        className={cn(
                          "flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300",
                        )}
                      >
                        <span>{category.name}</span>
                        <ChevronRight className={cn("w-4 h-4 transition-colors", isActive ? "text-blue-500" : "text-gray-400")} />
                      </Link>
                    );
                  })}

                  <div className="pt-5 mt-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">Quick Actions</p>

                    {/* Track Package - Mobile */}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setTrackingOpen(true);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Track My Package
                    </button>

                    {/* Wishlist - Mobile */}
                    <Link
                      to="/wishlist"
                      className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      Wishlist
                      {wishlist.length > 0 && (
                        <span className="ml-auto text-xs bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-semibold">
                          {wishlist.length}
                        </span>
                      )}
                    </Link>
                  </div>

                  <div className="pt-5 mt-4 border-t border-gray-100 dark:border-gray-800">
                    {user ? (
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-semibold">{user.name || "My Account"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">View profile</p>
                        </div>
                      </Link>
                    ) : (
                      <div className="space-y-2 px-4">
                        <Link to="/auth">
                          <Button variant="gradient" className="w-full">
                            Sign In
                          </Button>
                        </Link>
                        <Link to="/auth">
                          <Button variant="outline" className="w-full mt-2">
                            Create Account
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Package Tracker Drawer */}
        <PackageTracker
          isOpen={isTrackingOpen}
          onClose={() => setTrackingOpen(false)}
        />
      </header>
      <div className="h-[0.05vh]"></div>
    </>
  );
}
