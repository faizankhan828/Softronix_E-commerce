import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ui/use-toast";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart2,
  Menu,
  X,
  LogOut,
  Home,
  ExternalLink,
  Tag,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../contexts/AuthContext";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Logo } from "../../components/ui/logo";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
};

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Products",
    href: "/admin?tab=products",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Orders",
    href: "/admin?tab=orders",
    icon: <ShoppingCart className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/admin?tab=users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Coupons",
    href: "/admin?tab=coupons",
    icon: <Tag className="h-5 w-5" />,
  },
  {
    title: "Analytics",
    href: "/admin?tab=analytics",
    icon: <BarChart2 className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/admin?tab=settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Back to Store",
    href: "/",
    icon: <Home className="h-5 w-5" />,
    external: true,
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout, isAuthenticated } = useAuth();

  // Check if user is admin and redirect if not
  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoading(true);
      try {
        if (!isAuthenticated) {
          toast({
            title: "Authentication required",
            description: "Please log in to access the admin area",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        if (user?.role !== "admin") {
          toast({
            title: "Access denied",
            description: "You do not have permission to access the admin area",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [isAuthenticated, user, navigate, toast]);

  // Handle active tab based on URL
  useEffect(() => {
    // Extract tab from URL search params
    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get("tab");

    // Set active tab class for sidebar items
    const sidebarItems = document.querySelectorAll(".sidebar-item");
    sidebarItems.forEach((item) => {
      const itemHref = item.getAttribute("data-href");
      if (
        (location.pathname === "/admin" &&
          !currentTab &&
          itemHref === "/admin") ||
        (currentTab && itemHref?.includes(`tab=${currentTab}`))
      ) {
        item.classList.add("bg-gray-100", "text-gray-900");
        item.classList.remove("text-gray-600");
      } else {
        item.classList.remove("bg-gray-100", "text-gray-900");
        item.classList.add("text-gray-600");
      }
    });
  }, [location]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "AD";

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden flex items-center p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Menu"
          className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="ml-4 flex items-center gap-3">
          <Logo className="max-h-12" />
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Admin Panel
          </h1>
        </div>
      </div>

      {/* Sidebar for mobile */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden",
          sidebarOpen ? "block" : "hidden"
        )}
      >
        <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Logo className="max-h-12" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5" />
                Admin Panel
              </h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close Menu"
              className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                (location.pathname === "/admin" && item.href === "/admin") ||
                (location.pathname === "/admin" &&
                  location.search &&
                  location.search.includes(
                    `tab=${item.href.split("tab=")[1]}`
                  )) ||
                location.pathname === item.href;

              return item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  data-href={item.href}
                  className={cn(
                    "sidebar-item flex items-center py-3 px-4 text-sm font-medium rounded-md transition-colors duration-150",
                    "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="p-1.5 rounded-md mr-3 bg-gray-100 dark:bg-gray-800">
                    {item.icon}
                  </div>
                  <span className="truncate">{item.title}</span>
                  <ExternalLink className="ml-auto flex-shrink-0 h-4 w-4 text-gray-400" />
                </a>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  data-href={item.href}
                  className={cn(
                    "sidebar-item flex items-center py-3 px-4 text-sm font-medium rounded-md transition-colors duration-150",
                    isActive
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-md"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-md mr-3",
                      isActive
                        ? "bg-gray-200 dark:bg-gray-700"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Avatar className="h-9 w-9 border-2 border-gray-300 dark:border-gray-600">
                <AvatarImage
                  src={user?.avatar || undefined}
                  alt={user?.name || "Admin"}
                />
                <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-300">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:z-50 lg:w-72 bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700">
        <div className="p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <Logo className="max-h-14" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
          </div>
        </div>
        <div className="px-3 py-4 flex-1 overflow-y-auto">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                (location.pathname === "/admin" && item.href === "/admin") ||
                (location.pathname === "/admin" &&
                  location.search &&
                  location.search.includes(
                    `tab=${item.href.split("tab=")[1]}`
                  )) ||
                location.pathname === item.href;

              return item.external ? (
                <a
                  key={item.href}
                  href={item.href}
                  data-href={item.href}
                  className={cn(
                    "sidebar-item flex items-center py-3 px-4 text-sm font-medium rounded-md transition-colors duration-150",
                    "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <div className="p-1.5 rounded-md mr-3 bg-gray-100 dark:bg-gray-800">
                    {item.icon}
                  </div>
                  <span className="truncate">{item.title}</span>
                  <ExternalLink className="ml-auto flex-shrink-0 h-4 w-4 text-gray-400" />
                </a>
              ) : (
                <Link
                  key={item.href}
                  to={item.href}
                  data-href={item.href}
                  className={cn(
                    "sidebar-item flex items-center py-3 px-4 text-sm font-medium rounded-md transition-colors duration-150",
                    isActive
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-md"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-md mr-3",
                      isActive
                        ? "bg-gray-200 dark:bg-gray-700"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center p-3 rounded-lg bg-white dark:bg-gray-700">
            <Avatar className="h-10 w-10 border-2 border-gray-300">
              <AvatarImage
                src={user?.avatar || undefined}
                alt={user?.name || "Admin"}
              />
              <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.name || "Admin User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-300">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <main className="px-4 py-8 md:p-8">{children}</main>
      </div>
    </div>
  );
}
