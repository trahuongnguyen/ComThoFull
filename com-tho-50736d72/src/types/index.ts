export type UserRole = 'ADMIN' | 'USER';

export interface Profile {
  id?: number;
  username: string;
  role: UserRole;
  fullName: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;        // page hiện tại (0-based)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface Shift {
  id?: number;
  userId: number;
  startCash: number;
  endCash?: number;
  startTime: Date;
  endTime?: Date;
  status: 'open' | 'closed';
}

export interface ProductSummary {
  name: string;
  quantity: number;
  total: number;
}

export interface PromotionSummary {
  name: string;
  quantity: number; // Số hóa đơn áp dụng
  total: number; // Tổng số tiền đã giảm
}

export interface PaymentSummary {
  method: string;
  count: number;
  total: number;
}

export interface ShiftDetailResponse {
  shiftId: number;
  startTime: Date;
  endTime: Date;
  totalProductQuantity: number;
  totalRevenue: number; // Doanh thu thuần (tổng total_amount của các bill)
  startCash: number;
  endCash: number;
  products: ProductSummary[]; // Danh sách món ăn
  promotions: PromotionSummary[]; // Thông tin giảm giá
  payments: PaymentSummary[]; // Các phương thức thanh toán
}

export interface Floor {
  id?: number;
  name: string
}

export interface DeskRequest {
  name: string;
  floorId: number;
  capacity: number;
}

export interface Table {
  id: number;
  name: string;
  floorId: number;
  status: 'AVAILABLE' | 'ORDERING';
  capacity: number;
}

export interface Category {
  id?: number;
  name: string;
}

export interface FoodRequest {
  name: string;
  price: number;
  categoryId: number;
  canUpSize: boolean;
  upSizePrice?: number;
}

export interface FoodItem {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  canUpSize?: boolean;
  upSizePrice?: number;
}

export interface Topping {
  id?: number;
  name: string;
  price: number;
}

export interface OrderItemTopping {
  toppingId: number;
  name: string;
  price: number;
}

export interface OrderItem {
  id: number;
  foodId: number;
  foodName: string;
  quantity: number;
  unitPrice: number;
  toppings: OrderItemTopping[];
  note?: string;
  isUpsized?: boolean;
  upSizePrice?: number;
}

export interface Order {
  id: number;
  orderId: number; // Order number within a table (1, 2, 3, ...)
  tableId: number;
  tableName: string;
  items: OrderItem[];
  subtotal: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount: number;
  total: number;
  paymentMethod?: 'CASH' | 'CARD';
  status: 'pending' | 'paid';
  kitchenPrinted: boolean; // Whether kitchen invoice has been printed
  createdAt: Date;
  paidAt?: Date;
}

export interface OrderDetailTempRequest {
  foodId: number;
  count: number;
  canUpSize: boolean;
  toppingId: number[];
  note: string;
}

export interface OrderTempRequest {
  deskId: number;
  orderDetails: OrderDetailTempRequest[];
  note: string;
  discount: number;
  /** `YYYY-MM-DDTHH:mm:ss` theo Asia/Ho_Chi_Minh — khớp Spring `LocalDateTime` */
  startTime: string;
}

export interface Invoice {
  id: number;
  deskId: number;
  items: OrderItem[];
  totalBefore: number;
  totalDiscount: number;
  totalAmount: number;
  orderId: number;
  paymentMethod: 'CASH' | 'CARD';
  shiftId: number;
  paidAt: Date;
  staffName: string;
}

export interface Bill {
  id: number,
  orderId: number,
  shiftId: number,
  deskId: number,
  tableName: string,
  items: OrderItem[],
  subtotal: number,
  discountAmount: number,
  total: number,
  paymentMethod: 'CASH' | 'CARD',
  paidAt: Date,
  staffName: string,
}

export interface Staff {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  permissions: {
    canOrder: boolean;
    canPayment: boolean;
  };
  createdAt: Date
}
