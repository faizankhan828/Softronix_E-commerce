import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { Button } from "./ui/button";
import { Logo } from "./ui/logo";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  ShoppingBag,
  Heart,
  Menu,
  X,
  User,
  LogOut,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { useTheme } from "../contexts/ThemeContext";

// Navigation categories
const categories = [
  {
    label: "Women",
    subCategories: [
      "Dresses",
      "Tops",
      "Bottoms",
      "Outerwear",
      "Activewear",
      "Accessories",
    ],
  },
  {
    label: "Men",
    subCategories: [
      "Shirts",
      "Pants",
      "Outerwear",
      "Activewear",
      "Accessories",
    ],
  },
  {
    label: "Kids",
    subCategories: ["Girls", "Boys", "Baby", "Accessories"],
  },
  {
    label: "Collections",
    subCategories: ["New Arrivals", "Bestsellers", "Sustainable", "Sale"],
  },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart, loading } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check scroll position to apply shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Get cart items count safely
  const cartItemsCount = cart?.items?.length || 0;

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-300 bg-white bg-opacity-100  dark:bg-gray-900 dark:bg-opacity-100 dark:text-gray-100 ${
        isScrolled ? "shadow-md bg-white" : "bg-white"
      }`}
    >
      {/* Main navbar */}
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and mobile menu button */}
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 p-1.5 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <Link to="/" className="text-lg font-bold dark:text-gray-100">
              <Logo className="max-h-12 sm:max-h-14" />
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-1 dark:text-gray-100">
            <NavigationMenu className="relative">
              <NavigationMenuList>
                {categories.map((category) => (
                  <NavigationMenuItem key={category.label} className="relative">
                    <NavigationMenuTrigger className="dark:text-gray-100 dark:hover:bg-gray-800">
                      {category.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 grid-cols-2 bg-white bg-opacity-100 dark:bg-gray-800 dark:text-gray-100">
                        {category.subCategories.map((subCategory) => (
                          <li key={subCategory}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={`/shop?category=${encodeURIComponent(
                                  subCategory.toLowerCase()
                                )}`}
                                className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-700"
                              >
                                {subCategory}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}

                <NavigationMenuItem>
                  <Link
                    to="/shop"
                    className="block py-2 px-3 dark:text-gray-100 dark:hover:text-white"
                  >
                    Shop All
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-1">
            {/* Search - Hidden on mobile */}
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Search"
                  className="hidden sm:flex h-8 w-8 sm:h-10 sm:w-10 dark:text-gray-100 dark:hover:bg-gray-800"
                >
                  <Search size={16} className="sm:w-5 sm:h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 sm:w-80 bg-white bg-opacity-100 dark:bg-gray-800 dark:border-gray-700"
                align="end"
                sideOffset={5}
              >
                <form
                  onSubmit={handleSearch}
                  className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2"
                >
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  />
                  <Button
                    type="submit"
                    className="dark:bg-primary dark:text-white dark:hover:bg-primary/80"
                    size="sm"
                  >
                    Search
                  </Button>
                </form>
              </PopoverContent>
            </Popover>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${
                theme === "dark" ? "light" : "dark"
              } mode`}
              className="h-8 w-8 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>

            {/* Wishlist - Hidden on mobile */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Wishlist"
              className="hidden sm:flex h-8 w-8 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              <Link to="/wishlist">
                <Heart size={16} />
              </Link>
            </Button>

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              asChild
              aria-label="Cart"
              className="h-8 w-8 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              <Link to="/cart" className="relative">
                <ShoppingBag size={16} />
                {cartItemsCount > 0 && !loading && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* User account */}
            {isAuthenticated ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 dark:text-gray-100 dark:hover:bg-gray-800"
                    aria-label="Account"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="dark:bg-gray-700 dark:text-gray-100 text-xs">
                        {user?.name?.slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-44 bg-white bg-opacity-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                  align="end"
                  sideOffset={5}
                >
                  <div className="space-y-3">
                    <div className="font-medium text-sm truncate">
                      {user?.name || "User"}
                    </div>
                    <div className="space-y-1">
                      {user?.role === "admin" && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-sm dark:hover:bg-gray-700"
                          asChild
                        >
                          <Link to="/admin">
                            <User className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                            Admin Dashboard
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm dark:hover:bg-gray-700"
                        asChild
                      >
                        <Link to="/account">
                          <User className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Account
                        </Link>
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm dark:hover:bg-gray-700"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Logout
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                variant="ghost"
                asChild
                className="text-xs px-2 h-8 dark:text-gray-100"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="container mx-auto px-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="flex space-x-2">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
                <Button
                  type="submit"
                  className="dark:bg-primary dark:text-white dark:hover:bg-primary/80"
                  size="sm"
                >
                  <Search size={16} />
                </Button>
              </form>

              {/* Mobile Wishlist Link */}
              <Link
                to="/wishlist"
                className="flex items-center py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Heart size={16} className="mr-2" />
                Wishlist
              </Link>
              {/* Mobile menu items */}
              {categories &&
                categories.map((category) => (
                  <div key={category.label} className="space-y-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                      {category.label}
                    </h3>
                    <div className="ml-4 space-y-1">
                      {category.subCategories &&
                        category.subCategories.map((subCategory) => (
                          <Link
                            key={subCategory}
                            to={`/shop?category=${encodeURIComponent(
                              subCategory.toLowerCase()
                            )}`}
                            className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subCategory}
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <Link
                  to="/shop"
                  className="block py-2 font-medium text-gray-900 dark:text-gray-100 hover:text-primary dark:hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Shop All
                </Link>

                {/* Mobile-only wishlist link */}
                <Link
                  to="/wishlist"
                  className="xs:hidden block py-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Wishlist
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
