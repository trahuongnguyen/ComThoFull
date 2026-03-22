import { Category, DeskRequest, Floor, FoodItem, FoodRequest, Invoice, Order, OrderTempRequest, Page, Profile, Shift, ShiftDetailResponse, Table, Topping } from "@/types";

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Token expiration event for global handling
export const TOKEN_EXPIRED_EVENT = 'pos_token_expired';

function handleTokenExpired() {
  // Only remove user/token, shift data stays for reconnection
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
  window.dispatchEvent(new CustomEvent(TOKEN_EXPIRED_EVENT));
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('pos_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiration (401 Unauthorized)
    if (response.status === 401) {
      handleTokenExpired();
      return { error: 'Token expired' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || `Error: ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

async function fetchApiBlob(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: Blob; error?: string }> {
  const token = localStorage.getItem('pos_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiration (401 Unauthorized)
    if (response.status === 401) {
      handleTokenExpired();
      return { error: 'Token expired' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: errorData.message || `Error: ${response.status}` };
    }

    const data = await response.blob();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Network error' };
  }
}

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    fetchApi<{ token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getProfile: () =>
    fetchApi<Profile>('/api/auth/profile'),

  getAll: () =>
    fetchApi<any[]>('/api/auth'),

  getById: (id: number) =>
    fetchApi<any>(`/api/auth/${id}`),

  create: (data: any) =>
    fetchApi<any>('/api/auth', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    fetchApi<any>(`/api/auth/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/api/auth/${id}`, {
      method: 'DELETE',
    }),
};

// Categories API
export const categoriesApi = {
  getAll: () =>
    fetchApi<Category[]>('/api/categories'),

  getById: (id: number) =>
    fetchApi<any>(`/api/categories/${id}`),

  create: (category: Category) =>
    fetchApi<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name: category.name }),
    }),

  update: (id: number, category: Partial<Category>) =>
    fetchApi<any>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name: category.name }),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Foods API
export const foodsApi = {
  getByCategory: (categoryId?: number) =>
    fetchApi<FoodItem[]>(`/api/foods/category/${categoryId}`),

  getAll: () =>
    fetchApi<FoodItem[]>('/api/foods'),

  getById: (id: number) =>
    fetchApi<FoodItem>(`/api/foods/getOne/${id}`),

  create: (data: FoodRequest) =>
    fetchApi<FoodItem>('/api/foods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<FoodRequest>) =>
    fetchApi<FoodItem>(`/api/foods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/api/foods/${id}`, {
      method: 'DELETE',
    }),
};

export const floorsApi = {
  getAll: () =>
    fetchApi<Floor[]>('/api/floors'),

  getById: (floorId: number) =>
    fetchApi<Floor>(`/api/floors/${floorId}`),

  create: (data: Floor) =>
    fetchApi<Floor>('/api/floor', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Tables API
export const tablesApi = {
  getAll: () =>
    fetchApi<Table[]>('/api/desks'),

  getByFloor: (floorId: number) =>
    fetchApi<Table[]>(`/api/desks/floor/${floorId}`),

  getById: (id: number) =>
    fetchApi<Table>(`/api/desks/getOne/${id}`),

  create: (data: DeskRequest) =>
    fetchApi<Table>('/api/desks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<DeskRequest>) =>
    fetchApi<Table>(`/api/desks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/api/desks/${id}`, {
      method: 'DELETE',
    }),

  updateStatus: (id: number, status: 'AVAILABLE' | 'ORDERING') =>
    fetchApi<any>(`/api/desks/status/${id}?status=${status}`, {
      method: 'PUT',
    }),
};

// Toppings API
export const toppingsApi = {
  getAll: () =>
    fetchApi<Topping[]>('/api/toppings'),

  getById: (id: number) =>
    fetchApi<Topping>(`/api/toppings/${id}`),

  create: (data: Topping) =>
    fetchApi<Topping>('/api/toppings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Topping) =>
    fetchApi<Topping>(`/api/toppings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<void>(`/api/toppings/${id}`, {
      method: 'DELETE',
    }),
};

// Staff API
export const staffApi = {
  
};

// Orders API
export const ordersApi = {
  getAll: () =>
    fetchApi<any[]>('/api/orders'),

  getById: (id: number) =>
    fetchApi<any>(`/api/orders/${id}`),

  create: (data: any) =>
    fetchApi<any>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: any) =>
    fetchApi<any>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // complete: (id: number, paymentData: any) =>
  //   fetchApi<any>(`/api/orders/${id}/complete`, {
  //     method: 'POST',
  //     body: JSON.stringify(paymentData),
  //   }),

  createOrderTemp: (orderTempRequest: OrderTempRequest) =>
    fetchApiBlob('/api/orderTemp', {
      method: 'POST',
      body: JSON.stringify(orderTempRequest),
    }),
};

// Invoices API
export const invoicesApi = {
  getAll: () =>
    fetchApi<Invoice[]>('/api/invoices'),

  getByDateRange: (startDate: string, endDate: string, page?: number, size?: number) =>
    fetchApi<Invoice[]>(`/api/invoices?startDate=${startDate}&endDate=${endDate}`),

  getById: (id: number) =>
    fetchApi<Invoice>(`/api/invoices/${id}`),

  getByShift: (shiftId: number) => 
    fetchApi<Invoice[]>(`/api/invoices/shift/${shiftId}`),

  createBill: (shiftId: number, deskId: number, payment: 'CASH' | 'CARD', discount: number) =>
    fetchApiBlob(`/api/bill/${shiftId}/${deskId}/${payment}?discount=${discount}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/pdf',
      },
    }),
};

// Shifts API
export const shiftsApi = {
  getAll: (timeRange?: string, page?: number, size?: number) => {
    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange);
    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());
    const queryString = params.toString();
    return fetchApi<Page<Shift>>(`/api/shift${queryString ? `?${queryString}` : ''}`);
  },

  getCurrent: () =>
    fetchApi<Shift>('/api/shift/current'),

  getById: (id: number) =>
    fetchApi<ShiftDetailResponse>(`/api/shift/${id}/detail`),

  open: (startCash: number) =>
    fetchApi<Shift>(`/api/shift/start?startCash=${startCash}`, {
      method: 'POST',
    }),

  close: (shiftId: number, endCash: number) =>
    fetchApi<Shift>(`/api/shift/${shiftId}/end?endCash=${endCash}`, {
      method: 'POST',
    }),

  getSummary: (shiftId: number) =>
    fetchApi<any>(`/api/shift/${shiftId}/summary`),

  getDetail: (shiftId: number) =>
    fetchApi<Shift>(`/api/shift/${shiftId}/detail`),

};

// Printers API
// export const printersApi = {
//   getAll: () =>
//     fetchApi<PrinterInterface[]>('/api/printers'),

//   getById: (id: string) =>
//     fetchApi<PrinterInterface>(`/api/printers/${id}`),

//   updateStatus: (id: string, connected: boolean) =>
//     fetchApi<PrinterInterface>(`/api/printers/${id}/status`, {
//       method: 'PATCH',
//       body: JSON.stringify({ connected }),
//     }),
// };

// Types
// export interface PrinterInterface {
//   id: string;
//   name: string;
//   location: string;
//   connected: boolean;
//   type: 'kitchen' | 'receipt' | 'label';
// }

export { fetchApi, fetchApiBlob };
