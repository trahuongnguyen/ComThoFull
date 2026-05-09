import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Table, Category, FoodItem, Topping, Staff, DeskRequest, FoodRequest, Floor } from '@/types';
import { tablesApi, categoriesApi, foodsApi, toppingsApi, floorsApi, authApi } from '@/lib/api';
import { AuthContext } from './AuthContext';

interface RestaurantContextType {
  tables: Table[];
  categories: Category[];
  foodItems: FoodItem[];
  toppings: Topping[];
  staff: Staff[];
  isLoading: boolean;
  floors: Floor[];

  // Refresh functions
  refreshTables: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshFoodItems: () => Promise<void>;
  refreshToppings: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // Table operations
  addTable: (table: Omit<DeskRequest, 'id'>) => Promise<void>;
  updateTable: (id: number, table: Partial<DeskRequest>) => Promise<void>;
  deleteTable: (id: number) => Promise<void>;
  updateTableStatus: (id: number, status: Table['status']) => void;

  // Category operations
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: number, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // Food operations
  addFoodItem: (food: Omit<FoodRequest, 'id'>) => Promise<void>;
  updateFoodItem: (id: number, food: Partial<FoodItem>) => Promise<void>;
  deleteFoodItem: (id: number) => Promise<void>;

  // Topping operations
  addTopping: (topping: Omit<Topping, 'id'>) => Promise<void>;
  updateTopping: (id: number, topping: Partial<Topping>) => Promise<void>;
  deleteTopping: (id: number) => Promise<void>;

  // Staff operations
  addStaff: (staff: Omit<Staff, 'id' | 'createdAt'>) => Promise<void>;
  updateStaff: (id: number, staff: Partial<Staff>) => Promise<void>;
  deleteStaff: (id: number) => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const userRole = auth?.user?.role ?? null;
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [floors, setFloors] = useState<Floor[]>([]);

  // Refresh functions
  const refreshTables = useCallback(async () => {
    const { data } = await tablesApi.getAll();
    if (data) setTables(data);
  }, []);

  const refreshFloors = useCallback(async () => {
    const { data } = await floorsApi.getAll();
    if (data) setFloors(data);
  }, []);

  const refreshCategories = useCallback(async () => {
    const { data } = await categoriesApi.getAll();
    if (data) setCategories(data);
  }, []);

  const refreshFoodItems = useCallback(async () => {
    const { data } = await foodsApi.getAll();
    if (data) setFoodItems(data);
  }, []);

  const refreshToppings = useCallback(async () => {
    const { data } = await toppingsApi.getAll();
    if (data) setToppings(data);
  }, []);

  const refreshStaff = useCallback(async () => {
    const { data } = await authApi.getAll();
    if (data) setStaff(data);
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    // if (userRole == 'ADMIN') {
      await Promise.all([
        refreshFloors(),
        refreshTables(),
        refreshCategories(),
        refreshFoodItems(),
        refreshToppings(),
      ]);
      if(userRole === 'ADMIN') {
        await refreshStaff();
      }

    setIsLoading(false);
  }, [refreshFloors, refreshTables, refreshCategories, refreshFoodItems, refreshToppings, refreshStaff]);

  // Initial data load - only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshAll();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshAll]);

  // Table operations
  const addTable = useCallback(async (table: Omit<DeskRequest, 'id'>) => {
    const { data } = await tablesApi.create(table);
    if (data) {
      refreshTables();
    }
  }, []);

  const updateTable = useCallback(async (id: number, table: Partial<DeskRequest>) => {
    const { data } = await tablesApi.update(id, table);
    if (data) {
      refreshTables();
    }
  }, []);

  const deleteTable = useCallback(async (id: number) => {
    await tablesApi.delete(id);
    setTables(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTableStatus = useCallback((id: number, status: Table['status']) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    // Fire and forget API call
    tablesApi.updateStatus(id, status);
  }, []);

  // Category operations
  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    const { data } = await categoriesApi.create(category);
    if (data) {
      setCategories(prev => [...prev, data]);
    }
  }, []);

  const updateCategory = useCallback(async (id: number, category: Partial<Category>) => {
    const { data } = await categoriesApi.update(id, category);
    if (data) {
      setCategories(prev => prev.map(c => c.id === id ? data : c));
    }
  }, []);

  const deleteCategory = useCallback(async (id: number) => {
    await categoriesApi.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // Food operations
  const addFoodItem = useCallback(async (food: Omit<FoodRequest, 'id'>) => {
    const { data } = await foodsApi.create(food);
    if (data) {
      setFoodItems(prev => [...prev, data]);
    }
  }, []);

  const updateFoodItem = useCallback(async (id: number, food: Partial<FoodItem>) => {
    const { data } = await foodsApi.update(id, food);
    if (data) {
      setFoodItems(prev => prev.map(f => f.id === id ? data : f));
    }
  }, []);

  const deleteFoodItem = useCallback(async (id: number) => {
    await foodsApi.delete(id);
    setFoodItems(prev => prev.filter(f => f.id !== id));
  }, []);

  // Topping operations
  const addTopping = useCallback(async (topping: Omit<Topping, 'id'>) => {
    const { data } = await toppingsApi.create(topping);
    if (data) {
      setToppings(prev => [...prev, data]);
    }
  }, []);

  const updateTopping = useCallback(async (id: number, topping: Partial<Topping>) => {
    const { data } = await toppingsApi.update(id, topping as Topping);
    if (data) {
      setToppings(prev => prev.map(t => t.id === id ? data : t));
    }
  }, []);

  const deleteTopping = useCallback(async (id: number) => {
    await toppingsApi.delete(id);
    setToppings(prev => prev.filter(t => t.id !== id));
  }, []);

  // Staff operations
  const addStaff = useCallback(async (newStaff: Omit<Staff, 'id' | 'createdAt'>) => {
    const { data } = await authApi.create(newStaff);
    if (data) {
      setStaff(prev => [...prev, data]);
    }
  }, []);

  const updateStaff = useCallback(async (id: number, staffData: Partial<Staff>) => {
    const { data } = await authApi.update(id, staffData);
    if (data) {
      setStaff(prev => prev.map(s => s.id === id ? data : s));
    }
  }, []);

  const deleteStaff = useCallback(async (id: number) => {
    await authApi.delete(id);
    setStaff(prev => prev.filter(s => s.id !== id));
  }, []);

  return (
    <RestaurantContext.Provider
      value={{
        tables,
        categories,
        foodItems,
        toppings,
        staff,
        floors,
        isLoading,
        refreshTables,
        refreshCategories,
        refreshFoodItems,
        refreshToppings,
        refreshStaff,
        refreshAll,
        addTable,
        updateTable,
        deleteTable,
        updateTableStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        addFoodItem,
        updateFoodItem,
        deleteFoodItem,
        addTopping,
        updateTopping,
        deleteTopping,
        addStaff,
        updateStaff,
        deleteStaff,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
}
