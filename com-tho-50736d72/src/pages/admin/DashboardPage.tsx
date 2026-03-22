import React, { useState } from 'react';
import { BarChart3, TrendingUp, Receipt, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data
const revenueData = [
  { name: 'Mon', revenue: 4200000, orders: 42 },
  { name: 'Tue', revenue: 3800000, orders: 38 },
  { name: 'Wed', revenue: 5100000, orders: 51 },
  { name: 'Thu', revenue: 4600000, orders: 46 },
  { name: 'Fri', revenue: 6200000, orders: 62 },
  { name: 'Sat', revenue: 7500000, orders: 75 },
  { name: 'Sun', revenue: 6800000, orders: 68 },
];

const categoryData = [
  { name: 'Rice Bowls', value: 45, color: 'hsl(32, 95%, 55%)' },
  { name: 'Combo Meals', value: 25, color: 'hsl(199, 89%, 48%)' },
  { name: 'Noodles', value: 15, color: 'hsl(142, 76%, 36%)' },
  { name: 'Beverages', value: 10, color: 'hsl(270, 70%, 60%)' },
  { name: 'Desserts', value: 5, color: 'hsl(45, 93%, 47%)' },
];

const paymentData = [
  { name: 'Cash', value: 60, color: 'hsl(142, 76%, 36%)' },
  { name: 'Bank Transfer', value: 40, color: 'hsl(199, 89%, 48%)' },
];

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('week');

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = revenueData.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalRevenue / totalOrders;

  const formatCurrency = (amount: number) => {
    return (amount / 1000000).toFixed(1) + 'M VND';
  };

  return (
    <div className="p-6 overflow-auto h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bảng điều khiển</h1>
            <p className="text-muted-foreground">Tổng quan hiệu suất nhà hàng</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Hôm nay</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="year">Năm nay</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-success">+12.5%</span>
              <span className="text-sm text-muted-foreground">so với tuần trước</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-foreground">{totalOrders}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-success">+8.3%</span>
              <span className="text-sm text-muted-foreground">so với tuần trước</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Giá trị đơn trung bình</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(avgOrderValue / 1000)}K</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-success">+4.1%</span>
              <span className="text-sm text-muted-foreground">so với tuần trước</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nhân viên đang hoạt động</p>
                <p className="text-2xl font-bold text-foreground">5</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">2 người đang làm ca</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-foreground mb-6">Tổng quan doanh thu</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 22%)" />
                <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" />
                <YAxis stroke="hsl(215, 20%, 65%)" tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(220, 20%, 13%)', 
                    border: '1px solid hsl(220, 15%, 22%)',
                    borderRadius: '8px',
                    color: 'hsl(220, 20%, 98%)'
                  }}
                  formatter={(value: number) => [`${(value / 1000000).toFixed(2)}M VND`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(32, 95%, 55%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <h3 className="text-lg font-semibold text-foreground mb-6">Bán hàng theo danh mục</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`category-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(220, 20%, 13%)', 
                    border: '1px solid hsl(220, 15%, 22%)',
                    borderRadius: '8px',
                    color: 'hsl(220, 20%, 98%)'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-6">Phân bổ phương thức thanh toán</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`payment-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 grid grid-cols-2 gap-4">
              {paymentData.map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
