import React, { createContext, useContext, useState, useCallback } from 'react';
import { Order, OrderItem, Table } from '@/types';

interface OrderContextType {
  orders: Record<number, Order[]>; // tableId -> array of orders
  activeTableId: number | null;
  activeOrderId: number | null; // orderId of the active order
  setActiveTableId: (tableId: number | null) => void;
  setActiveOrderId: (orderId: number | null) => void;
  addItemToOrder: (tableId: number, tableName: string, item: Omit<OrderItem, 'id'>) => void;
  updateItemQuantity: (tableId: number, orderId: number, itemId: number, quantity: number) => void;
  updateItemToppings: (tableId: number, orderId: number, itemId: number, toppings: OrderItem['toppings'], note?: string, isUpsized?: boolean, upsizePrice?: number) => void;
  removeItem: (tableId: number, orderId: number, itemId: number) => void;
  getOrder: (tableId: number, orderId: number) => Order | undefined;
  getTableOrders: (tableId: number) => Order[];
  createNewOrder: (tableId: number, tableName: string) => void;
  markKitchenPrinted: (tableId: number, orderId: number) => void;
  completeOrder: (tableId: number, paymentMethod: 'CASH' | 'CARD', discountType?: 'percentage' | 'fixed', discountValue?: number) => Order[] | undefined;
  clearOrder: (tableId: number) => void;
  hasUnpaidOrders: () => boolean;
  getActiveOrders: () => Order[];
  canAddEditDelete: (tableId: number, orderId: number) => boolean;
  canPayment: (tableId: number) => boolean;
  getAllTableItemsCount: (tableId: number) => number;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Record<number, Order[]>>({});
  const [activeTableId, setActiveTableId] = useState<number | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [itemIdCounter, setItemIdCounter] = useState(1);
  const [orderIdCounter, setOrderIdCounter] = useState(1);
  const orderIdCounterRef = React.useRef(1);

  const calculateOrderTotals = (items: OrderItem[], discountType?: 'percentage' | 'fixed', discountValue?: number) => {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = (item.unitPrice + (item.isUpsized ? (item.upsizePrice || 0) : 0)) * item.quantity;
      const toppingsTotal = item.toppings.reduce((t, topping) => t + topping.price, 0) * item.quantity;
      return sum + itemTotal + toppingsTotal;
    }, 0);

    let discountAmount = 0;
    if (discountType && discountValue) {
      if (discountType === 'percentage') {
        discountAmount = subtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
    }

    return {
      subtotal,
      discountAmount,
      total: subtotal - discountAmount,
    };
  };

  const addItemToOrder = useCallback((tableId: number, tableName: string, item: Omit<OrderItem, 'id'>) => {
    setItemIdCounter(prev => {
      const newItemId = prev;
      setOrders(currentOrders => {
        const tableOrders = currentOrders[tableId] || [];
        
        // Find the last order that is not kitchen printed (can still be edited)
        let activeOrder = tableOrders.find(o => !o.kitchenPrinted);
        
        // If no editable order exists, create a new one
        if (!activeOrder) {
          const newOrderId = orderIdCounter;
          setOrderIdCounter(prev => prev + 1);
          const orderNumber = tableOrders.length + 1;
          activeOrder = {
            id: newOrderId,
            orderId: orderNumber,
            tableId: tableId,
            tableName,
            items: [],
            subtotal: 0,
            discountAmount: 0,
            total: 0,
            status: 'pending',
            kitchenPrinted: false,
            createdAt: new Date(),
          };
          tableOrders.push(activeOrder);
          setActiveOrderId(activeOrder.orderId);
        }

        const newItem: OrderItem = { ...item, id: newItemId + 1 };

        // Check if item already exists (same food, no toppings, no note)
        const existingItemIndex = activeOrder.items.findIndex(
          i => i.foodId === item.foodId && i.toppings.length === 0 && !i.note && item.toppings.length === 0 && !item.note
        );

        let updatedItems: OrderItem[];
        if (existingItemIndex >= 0) {
          updatedItems = activeOrder.items.map((i, idx) =>
            idx === existingItemIndex ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          updatedItems = [...activeOrder.items, newItem];
        }

        const totals = calculateOrderTotals(updatedItems, activeOrder.discountType, activeOrder.discountValue);

        const updatedOrder = {
          ...activeOrder,
          items: updatedItems,
          ...totals,
        };

        const updatedTableOrders = tableOrders.map(o => 
          o.orderId === activeOrder!.orderId ? updatedOrder : o
        );

        return {
          ...currentOrders,
          [tableId]: updatedTableOrders,
        };
      });
      return prev + 2;
    });
  }, [orderIdCounter]);

  const updateItemQuantity = useCallback((tableId: number, orderId: number, itemId: number, quantity: number) => {
    setOrders(prev => {
      const tableOrders = prev[tableId];
      if (!tableOrders) return prev;

      const order = tableOrders.find(o => o.orderId === orderId);
      if (!order || order.kitchenPrinted) return prev; // Cannot edit if kitchen printed

      const updatedItems = quantity <= 0
        ? order.items.filter(i => i.id !== itemId)
        : order.items.map(i => i.id === itemId ? { ...i, quantity } : i);

      if (updatedItems.length === 0) {
        // Remove order if no items
        const updatedTableOrders = tableOrders.filter(o => o.orderId !== orderId);
        if (updatedTableOrders.length === 0) {
          const { [tableId]: _, ...rest } = prev;
          return rest;
        }
        return {
          ...prev,
          [tableId]: updatedTableOrders,
        };
      }

      const totals = calculateOrderTotals(updatedItems, order.discountType, order.discountValue);

      const updatedOrder = {
        ...order,
        items: updatedItems,
        ...totals,
      };

      const updatedTableOrders = tableOrders.map(o => 
        o.orderId === orderId ? updatedOrder : o
      );

      return {
        ...prev,
        [tableId]: updatedTableOrders,
      };
    });
  }, []);

  const updateItemToppings = useCallback((
    tableId: number,
    orderId: number,
    itemId: number,
    toppings: OrderItem['toppings'],
    note?: string,
    isUpsized?: boolean,
    upsizePrice?: number
  ) => {
    setOrders(prev => {
      const tableOrders = prev[tableId];
      if (!tableOrders) return prev;

      const order = tableOrders.find(o => o.orderId === orderId);
      if (!order || order.kitchenPrinted) return prev; // Cannot edit if kitchen printed

      const updatedItems = order.items.map(i =>
        i.id === itemId ? { ...i, toppings, note, isUpsized, upsizePrice } : i
      );

      const totals = calculateOrderTotals(updatedItems, order.discountType, order.discountValue);

      const updatedOrder = {
        ...order,
        items: updatedItems,
        ...totals,
      };

      const updatedTableOrders = tableOrders.map(o => 
        o.orderId === orderId ? updatedOrder : o
      );

      return {
        ...prev,
        [tableId]: updatedTableOrders,
      };
    });
  }, []);

  const removeItem = useCallback((tableId: number, orderId: number, itemId: number) => {
    updateItemQuantity(tableId, orderId, itemId, 0);
  }, [updateItemQuantity]);

  const getOrder = useCallback((tableId: number, orderId: number) => {
    const tableOrders = orders[tableId];
    if (!tableOrders) return undefined;
    return tableOrders.find(o => o.orderId === orderId);
  }, [orders]);

  const getTableOrders = useCallback((tableId: number) => {
    return orders[tableId] || [];
  }, [orders]);

  const createNewOrder = useCallback((tableId: number, tableName: string) => {
    setOrders(currentOrders => {
      const tableOrders = currentOrders[tableId] || [];
      const orderNumber = tableOrders.length + 1;
      const newOrderId = orderIdCounterRef.current;
      orderIdCounterRef.current += 1;
      
      const newOrder: Order = {
        id: newOrderId,
        orderId: orderNumber,
        tableId: tableId,
        tableName,
        items: [],
        subtotal: 0,
        discountAmount: 0,
        total: 0,
        status: 'pending',
        kitchenPrinted: false,
        createdAt: new Date(),
      };

      // Set active order ID with the calculated orderNumber
      setActiveOrderId(orderNumber);
      setOrderIdCounter(orderIdCounterRef.current);

      return {
        ...currentOrders,
        [tableId]: [...tableOrders, newOrder],
      };
    });
  }, []);

  const markKitchenPrinted = useCallback((tableId: number, orderId: number) => {
    setOrders(prev => {
      const tableOrders = prev[tableId];
      if (!tableOrders) return prev;

      const updatedTableOrders = tableOrders.map(o =>
        o.orderId === orderId ? { ...o, kitchenPrinted: true } : o
      );

      return {
        ...prev,
        [tableId]: updatedTableOrders,
      };
    });
  }, []);

  const completeOrder = useCallback((
    tableId: number,
    paymentMethod: 'CASH' | 'CARD',
    discountType?: 'percentage' | 'fixed',
    discountValue?: number
  ): Order[] | undefined => {
    const tableOrders = orders[tableId];
    if (!tableOrders || tableOrders.length === 0) return undefined;

    // Calculate totals for all orders combined
    const allItems = tableOrders.flatMap(o => o.items);
    const totals = calculateOrderTotals(allItems, discountType, discountValue);

    const completedOrders: Order[] = tableOrders.map(order => ({
      ...order,
      ...totals,
      discountType,
      discountValue,
      paymentMethod,
      status: 'paid',
      paidAt: new Date(),
    }));

    setOrders(prev => {
      const { [tableId]: _, ...rest } = prev;
      return rest;
    });

    return completedOrders;
  }, [orders]);

  const clearOrder = useCallback((tableId: number) => {
    setOrders(prev => {
      const { [tableId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const hasUnpaidOrders = useCallback(() => {
    return Object.values(orders).some(tableOrders => 
      tableOrders.some(order => order.status === 'pending')
    );
  }, [orders]);

  const getActiveOrders = useCallback(() => {
    return Object.values(orders).flat().filter(order => order.status === 'pending');
  }, [orders]);

  const canAddEditDelete = useCallback((tableId: number, orderId: number) => {
    const order = getOrder(tableId, orderId);
    return order ? !order.kitchenPrinted : false;
  }, [getOrder]);

  const canPayment = useCallback((tableId: number) => {
    const tableOrders = getTableOrders(tableId);
    if (tableOrders.length === 0) return false;
    // Can payment only if all orders have been printed for kitchen
    return tableOrders.every(o => o.kitchenPrinted && o.items.length > 0);
  }, [getTableOrders]);

  const getAllTableItemsCount = useCallback((tableId: number) => {
    const tableOrders = getTableOrders(tableId);
    return tableOrders.reduce((sum, order) => sum + order.items.length, 0);
  }, [getTableOrders]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeTableId,
        activeOrderId,
        setActiveTableId,
        setActiveOrderId,
        addItemToOrder,
        updateItemQuantity,
        updateItemToppings,
        removeItem,
        getOrder,
        getTableOrders,
        createNewOrder,
        markKitchenPrinted,
        completeOrder,
        clearOrder,
        hasUnpaidOrders,
        getActiveOrders,
        canAddEditDelete,
        canPayment,
        getAllTableItemsCount,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
}
