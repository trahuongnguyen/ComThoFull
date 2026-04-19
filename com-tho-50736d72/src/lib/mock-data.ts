import type {
  Category,
  Floor,
  FoodItem,
  Page,
  Shift,
  ShiftDetailResponse,
  Staff,
  Table,
  Topping,
} from '@/types';

/** Bật true để luôn dùng mock (không gọi API cho danh sách), phục vụ dev/UI nhanh. */
export const ENABLE_USE_MOCK_DATA = false;

export const MOCK_FLOORS: Floor[] = [
  { id: 1, name: 'Tầng 1' },
  { id: 2, name: 'Tầng 2' },
  { id: 3, name: 'Tầng 3' },
];

export const MOCK_TABLES: Table[] = [
  { id: 1, name: 'Bàn 1', floorId: 1, status: 'AVAILABLE', capacity: 4 },
  { id: 2, name: 'Bàn 2', floorId: 1, status: 'AVAILABLE', capacity: 4 },
  { id: 3, name: 'Bàn 3', floorId: 1, status: 'ORDERING', capacity: 6 },
  { id: 4, name: 'Bàn 4', floorId: 2, status: 'AVAILABLE', capacity: 4 },
  { id: 5, name: 'Bàn 5', floorId: 2, status: 'AVAILABLE', capacity: 8 },
  { id: 6, name: 'Bàn 6', floorId: 3, status: 'AVAILABLE', capacity: 4 },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Cơm phần' },
  { id: 2, name: 'Combo' },
  { id: 3, name: 'Mì / Bún' },
  { id: 4, name: 'Đồ uống' },
  { id: 5, name: 'Tráng miệng' },
];

export const MOCK_FOOD_ITEMS: FoodItem[] = [
  { id: 1, name: 'Cơm thịt bò', price: 65000, categoryId: 1, canUpSize: true, upsizePrice: 15000 },
  { id: 2, name: 'Cơm gà', price: 55000, categoryId: 1, canUpSize: true, upsizePrice: 15000 },
  { id: 3, name: 'Cơm sườn', price: 60000, categoryId: 1, canUpSize: true, upsizePrice: 15000 },
  { id: 4, name: 'Combo gia đình A', price: 250000, categoryId: 2 },
  { id: 5, name: 'Phở bò', price: 55000, categoryId: 3, canUpSize: true, upsizePrice: 10000 },
  { id: 6, name: 'Cà phê sữa đá', price: 25000, categoryId: 4, canUpSize: true, upsizePrice: 5000 },
  { id: 7, name: 'Bánh flan', price: 25000, categoryId: 5 },
];

export const MOCK_TOPPINGS: Topping[] = [
  { id: 1, name: 'Trứng ốp la', price: 8000 },
  { id: 2, name: 'Thêm thịt', price: 20000 },
  { id: 3, name: 'Sườn thêm', price: 25000 },
  { id: 4, name: 'Rau thêm', price: 5000 },
];

export const MOCK_STAFF: Staff[] = [
  {
    id: 1,
    username: 'admin',
    fullName: 'Quản trị viên',
    role: 'ADMIN',
    permissions: { canOrder: true, canPayment: true },
    createdAt: new Date(),
  },
  {
    id: 2,
    username: 'staff',
    fullName: 'Nhân viên mẫu',
    role: 'USER',
    permissions: { canOrder: true, canPayment: true },
    createdAt: new Date(),
  },
];

export const MOCK_SHIFTS: Shift[] = Array.from({ length: 24 }, (_, i) => {
  const start = 500_000;
  const delta = 1_200_000 + i * 15_000;
  return {
    id: i + 1,
    userId: (i % 3) + 1,
    startCash: start,
    endCash: start + delta,
    startTime: new Date(Date.now() - (i + 1) * 86_400_000),
    endTime: new Date(Date.now() - (i + 1) * 86_400_000 + 8 * 3_600_000),
    status: 'closed' as const,
  };
});

function sliceToPage<T>(items: T[], pageIndex: number, pageSize: number): Page<T> {
  const totalElements = items.length;
  const totalPages = totalElements === 0 ? 1 : Math.ceil(totalElements / pageSize);
  const start = pageIndex * pageSize;
  const content = items.slice(start, start + pageSize);
  return {
    content,
    totalPages,
    totalElements,
    number: pageIndex,
    size: pageSize,
    first: pageIndex === 0,
    last: pageIndex >= totalPages - 1,
    empty: content.length === 0,
  };
}

/** Danh sách phẳng: ưu tiên mock nếu bật flag; nếu API lỗi / rỗng thì dùng mock. */
export async function fetchListWithMockFallback<T>(
  fetcher: () => Promise<{ data?: T[]; error?: string }>,
  mock: T[]
): Promise<T[]> {
  if (ENABLE_USE_MOCK_DATA) {
    return mock;
  }
  try {
    const { data, error } = await fetcher();
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return mock;
    }
    return data;
  } catch {
    return mock;
  }
}

/** Phân trang: tương tự fetchListWithMockFallback nhưng cho Page<T>. */
export async function fetchPageWithMockFallback<T>(
  fetcher: () => Promise<{ data?: Page<T>; error?: string }>,
  mockAllItems: T[],
  pageIndex: number,
  pageSize: number
): Promise<{ page: Page<T>; fromMock: boolean }> {
  if (ENABLE_USE_MOCK_DATA) {
    return { page: sliceToPage(mockAllItems, pageIndex, pageSize), fromMock: true };
  }
  try {
    const { data, error } = await fetcher();
    if (error || !data || !data.content || data.content.length === 0) {
      return { page: sliceToPage(mockAllItems, pageIndex, pageSize), fromMock: true };
    }
    return { page: data, fromMock: false };
  } catch {
    return { page: sliceToPage(mockAllItems, pageIndex, pageSize), fromMock: true };
  }
}

export function getMockShiftDetail(shiftId: number): ShiftDetailResponse {
  return {
    shiftId,
    startTime: new Date(Date.now() - 8 * 3_600_000),
    endTime: new Date(),
    totalProductQuantity: 42,
    totalRevenue: 3_500_000,
    startCash: 500_000,
    endCash: 4_000_000,
    products: [
      { name: 'Cơm thịt bò', quantity: 12, total: 780_000 },
      { name: 'Phở bò', quantity: 8, total: 440_000 },
      { name: 'Cà phê sữa đá', quantity: 22, total: 550_000 },
    ],
    promotions: [{ name: 'Giảm 10%', quantity: 3, total: 120_000 }],
    payments: [
      { method: 'Tiền mặt', count: 15, total: 2_100_000 },
      { method: 'Thẻ', count: 9, total: 1_400_000 },
    ],
  };
}
