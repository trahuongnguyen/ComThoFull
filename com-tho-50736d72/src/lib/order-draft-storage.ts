import type { Order } from '@/types';

const STORAGE_KEY = 'restopos:order-draft:v1';

export interface OrderDraftSnapshot {
  shiftId: number;
  orders: Record<number, Order[]>;
  activeTableId: number | null;
  activeOrderId: number | null;
  itemIdCounter: number;
  orderIdCounter: number;
}

function reviveOrder(o: Order): Order {
  return {
    ...o,
    createdAt: o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt as unknown as string),
    paidAt:
      o.paidAt == null
        ? undefined
        : o.paidAt instanceof Date
          ? o.paidAt
          : new Date(o.paidAt as unknown as string),
  };
}

/** Khôi phục draft chỉ khi trùng ca làm việc hiện tại */
export function loadOrderDraft(shiftId: number): OrderDraftSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OrderDraftSnapshot & { shiftId?: number };
    if (parsed.shiftId !== shiftId || typeof parsed.orders !== 'object') return null;

    const orders: Record<number, Order[]> = {};
    for (const [k, list] of Object.entries(parsed.orders)) {
      const tableId = Number(k);
      if (Number.isNaN(tableId) || !Array.isArray(list)) continue;
      orders[tableId] = list.map(reviveOrder);
    }

    return {
      shiftId: parsed.shiftId,
      orders,
      activeTableId:
        parsed.activeTableId === null || typeof parsed.activeTableId === 'number'
          ? parsed.activeTableId
          : null,
      activeOrderId:
        parsed.activeOrderId === null || typeof parsed.activeOrderId === 'number'
          ? parsed.activeOrderId
          : null,
      itemIdCounter: typeof parsed.itemIdCounter === 'number' ? parsed.itemIdCounter : 1,
      orderIdCounter: typeof parsed.orderIdCounter === 'number' ? parsed.orderIdCounter : 1,
    };
  } catch {
    return null;
  }
}

export function saveOrderDraft(snapshot: OrderDraftSnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // quota / private mode — bỏ qua
  }
}

export function clearOrderDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Tính lại counter an toàn sau khi load từ JSON */
export function computeCountersFromOrders(orders: Record<number, Order[]>): {
  itemIdCounter: number;
  orderIdCounter: number;
  orderIdCounterRefBase: number;
} {
  let maxItemId = 0;
  let maxOrderInternalId = 0;
  for (const list of Object.values(orders)) {
    for (const o of list) {
      maxOrderInternalId = Math.max(maxOrderInternalId, o.id);
      for (const it of o.items) {
        maxItemId = Math.max(maxItemId, it.id);
      }
    }
  }
  const itemIdCounter = maxItemId > 0 ? maxItemId + 1 : 1;
  const orderIdCounter = maxOrderInternalId > 0 ? maxOrderInternalId + 1 : 1;
  return { itemIdCounter, orderIdCounter, orderIdCounterRefBase: orderIdCounter };
}

/** State khởi tạo cho OrderProvider (một lần mỗi lần mount / đổi ca) */
export function getInitialOrderState(shiftId: number | undefined): OrderDraftSnapshot & {
  orderIdCounterRefBase: number;
} {
  if (!shiftId) {
    return {
      shiftId: 0,
      orders: {},
      activeTableId: null,
      activeOrderId: null,
      itemIdCounter: 1,
      orderIdCounter: 1,
      orderIdCounterRefBase: 1,
    };
  }
  const draft = loadOrderDraft(shiftId);
  if (!draft) {
    return {
      shiftId,
      orders: {},
      activeTableId: null,
      activeOrderId: null,
      itemIdCounter: 1,
      orderIdCounter: 1,
      orderIdCounterRefBase: 1,
    };
  }
  const c = computeCountersFromOrders(draft.orders);
  const itemIdCounter = Math.max(draft.itemIdCounter, c.itemIdCounter);
  const orderIdCounter = Math.max(draft.orderIdCounter, c.orderIdCounter);
  const orderIdCounterRefBase = Math.max(orderIdCounter, c.orderIdCounterRefBase);
  return {
    shiftId,
    orders: draft.orders,
    activeTableId: draft.activeTableId,
    activeOrderId: draft.activeOrderId,
    itemIdCounter,
    orderIdCounter,
    orderIdCounterRefBase,
  };
}
