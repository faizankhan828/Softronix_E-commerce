import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingBag, User, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Logo } from "@/components/ui/Logo";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
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
  const location = useLocation();

  const { cart, setCartOpen, setFilters } = useStore();
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
  <>  <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        isScrolled
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg"
          : "bg-white dark:bg-gray-900",
      )}
    >
    

      {/* Main Navbar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 lg:h-16">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {categories.map((category) => (
              <Link
                key={category.name}
                to={category.path}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname + location.search === category.path
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Toggle theme"
            >
              {ThemeIcon}
            </button>

            {/* Search Button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Menu */}
            <Link
              to={user ? "/profile" : "/auth"}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartItemsCount > 9 ? "9+" : cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b shadow-lg p-4"
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
                  className="pr-24"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                >
                  Search
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden bg-white dark:bg-gray-900 border-b"
          >
            <nav className="container mx-auto px-4 py-4 space-y-1">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={category.path}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                    location.pathname + location.search === category.path
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  {category.name}
                </Link>
              ))}
              <div className="pt-4 border-t mt-4">
                {user ? (
                  <Link
                    to="/profile"
                    className="block px-4 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    My Account
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link to="/auth">
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button className="w-full">Create Account</Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
    <div className="h-[0.05vh]"></div>
  </>
  );
}
