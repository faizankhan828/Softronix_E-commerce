import { User, ShoppingBag, Heart, Settings, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProfileSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function ProfileSidebar({ activeSection, setActiveSection }: ProfileSidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'wishlist', label: 'Wishlist', icon: Heart }, // If Wishlist is implemented here
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-full md:w-64 space-y-6">
      {/* User Info Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
            {user?.avatar ? (
                <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover border-2 border-primary/20"
                />
            ) : (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/20">
                    {user?.name?.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
        <h2 className="text-lg font-semibold text-foreground">{user?.name}</h2>
        <p className="text-sm text-muted-foreground">{user?.email}</p>

        {/* Admin Dashboard - Distinct & Persistent */}
        {user?.role === 'admin' && (
             <div className="w-full mt-4 pt-4 border-t border-white/10">
                <button
                    onClick={() => navigate('/admin')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 text-sm font-medium"
                >
                    <Shield className="w-4 h-4" />
                    Admin Dashboard
                </button>
            </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeSection === item.id
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        {/* Admin link removed as per user request */}

        <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200 mt-4"
        >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
        </button>
      </nav>
    </div>
  );
}
