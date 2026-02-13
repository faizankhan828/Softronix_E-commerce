import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
// import { fixUI } from "../../lib/ui-fix";
import {
  Tabs,
  TabsContent,
//   TabsList,
//   TabsTrigger,
} from "@/components/ui/Tabs";

// API services
import productService from "../api/services/productService";
import dashboardService from "../api/services/dashboardService";
import couponService, { Coupon } from "../api/services/couponService";
import type { Product } from "../api/services/productService";


import userService from "../api/services/userService";
import api from "../api/services/api";

// Custom components
import AdminLayout from "../components/Admin/AdminLayout";
import DashboardHeader from "../components/Admin/DashboardHeader";
import ProductsTable from "../components/Admin/ProductsTable";
import OrdersTable, { Order } from "../components/Admin/OrdersTable";
import UsersTable, { User } from "../components/Admin/UsersTable";
import ProductForm from "../components/Admin/ProductForm";
import CouponsTable from "../components/Admin/CouponsTable";
import CouponForm from "../components/Admin/CouponForm";
import SettingsPanel from "../components/Admin/SettingsPanel";
import RecentActivityComponent from "../components/Admin/RecentActivity";
import SalesChart, { SalesData } from "../components/Admin/SalesChart";
import TopProducts, { TopProduct } from "../components/Admin/TopProducts";
import { RecentActivity as RecentActivityType } from "../api/services/dashboardService";


interface RecentActivityData extends RecentActivityType {}

// Helper function to replace fixUI
const fixUI = () => {
  document.body.style.pointerEvents = "";
};

export default function AdminDashboard() {
  const { user: currentUser /* isAuthenticated */ } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
  });
  const [trends, setTrends] = useState({
    revenue: { value: 12, isPositive: true },
    orders: { value: 8, isPositive: true },
    customers: { value: 5, isPositive: true },
    products: { value: 3, isPositive: true },
  });

  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityData>({
    orders: [],
    users: [],
    products: [],
  });

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);
  // const [error, setError] = useState(null);

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [isEditCouponOpen, setIsEditCouponOpen] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: 0,
    description: "",
    category: "",
    images: [""],
    inventory: 0,
    colors: ["Black", "White"],
    sizes: ["S", "M", "L"],
    inStock: true,
    isNew: false,
    isFeatured: false,
    material: "",
    fit: "",
    care: "",
    origin: "",
  });


  const tabFromUrl = searchParams.get("tab") || "dashboard";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  useEffect(() => {
    setLoading(false);
    setProductsLoading(false);
    setOrdersLoading(false);
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    const currentTab = searchParams.get("tab") || "dashboard";
    setActiveTab(currentTab);
  }, [searchParams]);

// Fetch initial data
  const fetchInitialData = async () => {
    setLoading(true);
    try {
        // In a real app, verify admin auth here
        
        try {
            // Fetch everything in parallel
            const [dashboardData, productsData, ordersData, usersData] = await Promise.all([
                dashboardService.getDashboardStats(),
                productService.getAdminProducts(),
                // orderService.getOrders(), // Uncomment when ready
                // userService.getUsers() // Uncomment when ready
                Promise.resolve([]), // Placeholder for orders
                Promise.resolve([])  // Placeholder for users
            ]);

            // If fetch was successful (or placeholders returned)
            setDashboardStats(dashboardData.stats);
            setSalesData(dashboardData.salesData);
            setTopProducts(dashboardData.topProducts);
            setRecentActivity(dashboardData.recentActivity);
            setTrends(dashboardData.trends);
            
            setProducts(productsData);
            // setOrders(ordersData);
            // setUsers(usersData);
            
            // To actually uncomment, I will do it here:
             const realOrders = await import("../api/services/orderService").then(m => m.getOrders().catch(() => []));
             setOrders(realOrders);
             
             const realUsers = await userService.getUsers().catch(() => []);
             setUsers(realUsers);

        } catch (error) {
             console.error("Error fetching dashboard data:", error);
             toast({
                title: "Error",
                description: "Failed to load dashboard data",
                variant: "destructive",
             });
        }
    } catch (error) {
        console.error("Error in fetchInitialData:", error);
    } finally {
        setLoading(false);
        setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
    return () => {
        document.body.style.pointerEvents = "";
    };
  }, []);

  const fetchCouponsData = async () => {
    setCouponsLoading(true);
    try {
      const response = await couponService.getAllCoupons();
      setCoupons(response);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: "Failed to load coupons.",
        variant: "destructive",
      });
      setCoupons([]);
    } finally {
      setCouponsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await productService.getAdminProducts();
      setProducts(response || []);
      return response;
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      return [];
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchOrdersData = async () => {
    setOrdersLoading(true);
    try {
      const response = await api.get("/orders/admin/all");
      let ordersData = [];
       if (response.data && response.data.orders) {
        ordersData = response.data.orders;
      } else if (Array.isArray(response.data)) {
        ordersData = response.data;
      }
      setOrders(ordersData);
      return ordersData;
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      return [];
    } finally {
      setOrdersLoading(false);
    }
  };

    const fetchUsersData = async () => {
    setUsersLoading(true);
    try {
      const response = await api.get("/users?all=true");
      let usersData = [];
      if (response.data && response.data.users) {
        usersData = response.data.users;
      } else if (Array.isArray(response.data)) {
        usersData = response.data;
      }
      setUsers(usersData);
      return usersData;
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      return [];
    } finally {
      setUsersLoading(false);
    }
  };


  useEffect(() => {
    if (activeTab === "orders") fetchOrdersData();
    else if (activeTab === "users") fetchUsersData();
    else if (activeTab === "coupons") fetchCouponsData();
    else if (activeTab === "products") fetchProducts();
  }, [activeTab]);

  const handleApplyUIFix = () => {
      setTimeout(() => {
          fixUI();
          document.body.style.pointerEvents = "";
      }, 100);
  };

  // Handlers (Simplified for now, assume props passed correctly)
  const handleAddProduct = async (data) => {
      try {
          const response = await productService.createProduct(data);
          setProducts([...products, response]);
          setIsAddProductOpen(false);
          toast({ title: "Success", description: "Product created successfully" });
      } catch (err) {
          toast({ title: "Error", description: "Failed to create product", variant: "destructive" });
      }
  };

  const handleSaveEdit = async (id, data) => {
      try {
          const response = await productService.updateProduct(id, data);
          setProducts(products.map(p => p.id === id || p._id === id ? response : p));
          setIsEditProductOpen(false);
           toast({ title: "Success", description: "Product updated successfully" });
      } catch (err) {
           toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
      }
  };

  const handleDeleteProduct = async (id) => {
      if(!confirm("Are you sure?")) return;
       try {
          await productService.deleteProduct(id);
          setProducts(products.filter(p => p.id !== id && p._id !== id));
          toast({ title: "Success", description: "Product deleted" });
      } catch (err) {
           toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
      }
  };

  const handleEditProduct = (product) => {
      setSelectedProduct(product);
      setIsEditProductOpen(true);
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
      // Implement logic
       toast({ title: "Info", description: "Order status update logic needs to be implemented fully." });
       // Logic from mamo:
       // const response = await api.put(`/orders/${mongoId}/status`, { status });
       // update local state
  };

  // Coupon handlers
  const handleAddCoupon = async (data) => {
      try {
          await couponService.createCoupon(data);
          fetchCouponsData();
          setIsAddCouponOpen(false);
          toast({ title: "Success", description: "Coupon created" });
      } catch (err) {
          toast({ title: "Error", description: "Failed to create coupon", variant: "destructive" });
      }
  };
  
   const handleEditCoupon = (coupon) => {
      setSelectedCoupon(coupon);
      setIsEditCouponOpen(true);
  };

  const handleSaveEditCoupon = async (id, data) => {
      try {
           await couponService.updateCoupon(id, data);
           fetchCouponsData();
           setIsEditCouponOpen(false);
            toast({ title: "Success", description: "Coupon updated" });
      } catch (err) {
          toast({ title: "Error", description: "Failed to update coupon", variant: "destructive" });
      }
  };

  const handleDeleteCoupon = async (id) => {
       if(!confirm("Are you sure?")) return;
        try {
           await couponService.deleteCoupon(id);
           fetchCouponsData();
            toast({ title: "Success", description: "Coupon deleted" });
      } catch (err) {
          toast({ title: "Error", description: "Failed to delete coupon", variant: "destructive" });
      }
  };
  
  // User handlers (placeholder)
  const handleInspectUser = (user) => {};
  const handleDeleteUser = (id) => {};
  const handleToggleUserStatus = (id, status) => {};
  const handleChangeUserRole = (id, role) => {};


  return (
    <AdminLayout>
      <div className="space-y-8">
        <DashboardHeader 
          stats={dashboardStats} 
          trends={trends} 
          isLoading={loading}
          onRefresh={fetchInitialData}
        />
        
        {/* Dashboard Home View - Charts */}
        {(activeTab === 'dashboard' || !activeTab) && (
            <div className="space-y-6 animate-fade-in">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SalesChart salesData={salesData} isLoading={loading} />
                    <TopProducts products={topProducts} isLoading={loading} />
                 </div>
                 <RecentActivityComponent
              recentActivity={recentActivity}
            />        recentUsers={recentActivity.users}
                    recentProducts={recentActivity.products}
                    isLoading={loading}
                 />
            </div>
        )}
        
        {/* Other Tabs */}
        <div>
          {/* Products Tab */}
          {activeTab === 'products' && (
             <ProductsTable 
                products={products} 
                loading={productsLoading} 
                onEdit={handleEditProduct} 
                onDelete={handleDeleteProduct} 
                onAddNew={() => setIsAddProductOpen(true)} 
             />
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <OrdersTable 
                orders={orders} 
                loading={ordersLoading} 
                onViewDetails={() => {}} 
                onUpdateStatus={handleUpdateOrderStatus} 
            />
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersTable 
                users={users} 
                loading={usersLoading} 
                onInspectUser={handleInspectUser}
                onDeleteUser={handleDeleteUser}
                onToggleUserStatus={handleToggleUserStatus}
                onChangeUserRole={handleChangeUserRole}
                onViewDetails={() => {}} 
            />
          )}

          {/* Activity Tab (if separate) or Analytics */}
          {activeTab === 'analytics' && <UserAnalytics users={users} orders={orders} />}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
              <CouponsTable
                coupons={coupons}
                loading={couponsLoading}
                onEdit={handleEditCoupon}
                onDelete={handleDeleteCoupon}
                onAddNew={() => setIsAddCouponOpen(true)}
                onRefresh={fetchCouponsData}
              />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </div>

       {/* Add Product Dialog */}
       <Dialog
        open={isAddProductOpen}
        onOpenChange={(open) => {
          setIsAddProductOpen(open);
          if (!open) handleApplyUIFix();
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden"
          onEscapeKeyDown={() => { setIsAddProductOpen(false); handleApplyUIFix(); }}
          onPointerDownOutside={() => { setIsAddProductOpen(false); handleApplyUIFix(); }}
        >
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Enter the details for the new product.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
            <ProductForm
              initialData={newProduct}
              onSubmit={handleAddProduct}
              onCancel={() => setIsAddProductOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog
        open={isEditProductOpen}
        onOpenChange={(open) => {
          setIsEditProductOpen(open);
          if (!open) {
            if (selectedProduct) setSelectedProduct(null);
            handleApplyUIFix();
          }
        }}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-hidden"
          onEscapeKeyDown={() => { setIsEditProductOpen(false); handleApplyUIFix(); }}
          onPointerDownOutside={() => { setIsEditProductOpen(false); handleApplyUIFix(); }}
        >
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details.</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
              <ProductForm
                initialData={selectedProduct}
                onSubmit={(data) => handleSaveEdit(selectedProduct.id || selectedProduct._id, data)}
                onCancel={() => setIsEditProductOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Coupon Dialog */}
      <Dialog
        open={isAddCouponOpen}
        onOpenChange={(open) => {
          setIsAddCouponOpen(open);
          if(!open) handleApplyUIFix();
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Add New Coupon</DialogTitle>
            <DialogDescription>Create a new discount coupon.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
            <CouponForm
              onSubmit={handleAddCoupon}
              onCancel={() => setIsAddCouponOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
     
      {/* Edit Coupon Dialog */}
      <Dialog
        open={isEditCouponOpen}
        onOpenChange={(open) => {
          setIsEditCouponOpen(open);
          if(!open) {
              if (selectedCoupon) setSelectedCoupon(null);
              handleApplyUIFix();
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update the coupon details.</DialogDescription>
          </DialogHeader>
          {selectedCoupon && (
            <div className="overflow-y-auto pr-2 max-h-[calc(90vh-120px)]">
              <CouponForm
                initialData={selectedCoupon}
                onSubmit={(data) => handleSaveEditCoupon(selectedCoupon._id || selectedCoupon.id, data)}
                onCancel={() => setIsEditCouponOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
}
