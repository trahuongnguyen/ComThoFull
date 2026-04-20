import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Receipt, 
  Users, 
  Settings, 
  LogOut,
  ChefHat,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useShift } from '@/contexts/ShiftContext';
import { cn } from '@/lib/utils';
import { formatTimeVN } from '@/lib/datetime';

const userMenuItems = [
  { icon: Clock, label: 'Mở ca', path: '/open-shift' },
  { icon: UtensilsCrossed, label: 'Đơn hàng', path: '/orders' },
];

const adminMenuItems = [
  { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/admin/dashboard' },
  { icon: Receipt, label: 'Hóa đơn', path: '/admin/invoices' },
  { icon: Users, label: 'Nhân viên', path: '/admin/staff' },
  { icon: Settings, label: 'Nhà hàng', path: '/admin/restaurant' },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { currentShift } = useShift();
  const location = useLocation();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="w-64 h-screen gradient-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-button">
            <ChefHat className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">RestoPOS</h1>
            <p className="text-xs text-muted-foreground">Hệ thống nhà hàng</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* User Menu */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            Vận hành
          </p>
          {userMenuItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-button'
                    : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                )
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Admin Menu */}
        {isAdmin && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
              Quản trị
            </p>
            {adminMenuItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-button'
                      : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* User Info & Shift Status */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        {currentShift && (
          <div className="px-3 py-2 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-xs text-success font-medium">Ca đang hoạt động</p>
            <p className="text-xs text-muted-foreground">
              Từ {formatTimeVN(currentShift.startTime)}
            </p>
          </div>
        )}
        
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {user?.fullName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role === 'ADMIN' ? 'Quản trị' : 'Nhân viên'}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
