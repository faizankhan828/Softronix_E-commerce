import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronRight } from 'lucide-react';
import type { Order } from '../../api/services/orderService';
import { getOrders } from '../../api/services/orderService';
import { Link } from 'react-router-dom';

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'shipped': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'processing': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return CheckCircle;
      case 'shipped': return Truck;
      case 'processing': return Clock;
      case 'cancelled': return XCircle;
      default: return Package;
    }
  };

  if (loading) {
    return (
        <div className="space-y-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" />
            ))}
        </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
        <p className="text-muted-foreground mb-6">Start shopping to see your orders here.</p>
        <Link 
            to="/shop" 
            className="inline-flex items-center justify-center px-6 py-2 bg-primary text-primary-foreground font-medium rounded-full hover:bg-primary/90 transition-colors"
        >
            Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Order History</h2>
      {orders.map((order) => {
        const StatusIcon = getStatusIcon(order.status);
        const statusStyle = getStatusColor(order.status);

        return (
          <div 
            key={order._id || order.id} 
            className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all duration-300 backdrop-blur-sm"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${statusStyle}`}>
                    <StatusIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order #{order.orderId || (order._id || order.id)?.slice(-8).toUpperCase()}</p>
                  <p className="font-semibold text-lg">${order.totalAmount?.toFixed(2) || order.total?.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyle}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                        View Details <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
