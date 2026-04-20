import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, StickyNote, Trash2, CreditCard, Printer, UtensilsCrossed, Lock } from 'lucide-react';
import { useOrder } from '@/contexts/OrderContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ordersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { OrderTempRequest } from '@/types';
import { formatCurrency } from '@/lib/format';

interface OrderPanelProps {
  onPayment: () => void;
  onPrintKitchen: (pdfBlob: Blob) => void;
  onAddTopping: (tableId: number, orderId: number, itemId: number) => void;
}

export function OrderPanel({ onPayment, onPrintKitchen, onAddTopping }: OrderPanelProps) {
  const { 
    orders, 
    activeTableId, 
    activeOrderId,
    setActiveTableId, 
    setActiveOrderId,
    updateItemQuantity, 
    removeItem,
    getTableOrders,
    createNewOrder,
    markKitchenPrinted,
    canAddEditDelete,
    canPayment,
    getAllTableItemsCount,
  } = useOrder();
  const { tables, updateTableStatus } = useRestaurant();
  const { toast } = useToast();
  const [isLoadingKitchen, setIsLoadingKitchen] = useState(false);

  const tableOrders = useMemo(() => {
    return activeTableId ? getTableOrders(activeTableId) : [];
  }, [activeTableId, getTableOrders, orders]);
  
  const currentOrder = activeTableId && activeOrderId 
    ? tableOrders.find(o => o.orderId === activeOrderId) 
    : null;
  
  // Memoize current table status to avoid unnecessary re-renders
  const currentTableStatus = useMemo(() => {
    return tables.find(t => t.id === activeTableId)?.status;
  }, [tables, activeTableId]);

  // Auto-select first order when table is selected
  useEffect(() => {
    if (activeTableId && tableOrders.length > 0 && !activeOrderId) {
      setActiveOrderId(tableOrders[0].orderId);
    }
  }, [activeTableId, tableOrders, activeOrderId, setActiveOrderId]);

  // Check if table should be reset to AVAILABLE when all items are removed
  useEffect(() => {
    if (!activeTableId) return;
    
    const totalItems = getAllTableItemsCount(activeTableId);
    
    // Only update if table is not already AVAILABLE and conditions are met
    if (totalItems === 0 && currentTableStatus !== 'AVAILABLE') {
      // Check if any order has been printed
      const hasPrintedOrder = tableOrders.some(o => o.kitchenPrinted);
      if (!hasPrintedOrder) {
        // Change table status back to AVAILABLE
        updateTableStatus(activeTableId, 'AVAILABLE');
      }
    }
  }, [activeTableId, tableOrders.length, getAllTableItemsCount, updateTableStatus, currentTableStatus]);

  const handlePrintKitchen = async () => {
    if (!currentOrder || !activeTableId || !activeOrderId) return;

    setIsLoadingKitchen(true);

    try {
      // Group items and collect toppingIds as array
      const orderDetails = currentOrder.items.map(item => ({
        foodId: item.foodId,
        count: item.quantity,
        canUpSize: item.isUpsized || false,
        toppingId: item.toppings.map(t => t.toppingId),
        note: item.note || '',
      }));

      const orderTempRequest: OrderTempRequest = {
        deskId: currentOrder.tableId,
        orderDetails,
        note: currentOrder.items.map(item => item.note).filter(Boolean).join('; ') || '',
        discount: currentOrder.discountAmount || 0,
        startTime: new Date(),
      };

      // Call API to generate and get PDF
      const { data: pdfBlob, error } = await ordersApi.createOrderTemp(orderTempRequest);

      if (error) {
        toast({
          title: 'Không thể tạo hóa đơn bếp',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      if (pdfBlob) {
        markKitchenPrinted(activeTableId, activeOrderId);
        onPrintKitchen(pdfBlob);
        toast({
          title: 'Đã in hóa đơn bếp',
          description: `Đơn ${activeOrderId} đã được gửi đến bếp`,
        });
      }
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi tạo hóa đơn bếp',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingKitchen(false);
    }
  };

  const handleCreateNewOrder = () => {
    if (!activeTableId) return;
    const table = tables.find(t => t.id === activeTableId);
    if (!table) return;
    createNewOrder(activeTableId, table.name);
  };

  const handleRemoveItem = (itemId: number) => {
    if (!activeTableId || !activeOrderId) return;
    removeItem(activeTableId, activeOrderId, itemId);
    // Table status check is handled by useEffect watching tableOrders
  };

  const handleUpdateQuantity = (itemId: number, quantity: number) => {
    if (!activeTableId || !activeOrderId) return;
    updateItemQuantity(activeTableId, activeOrderId, itemId, quantity);
    // Table status check is handled by useEffect watching tableOrders
  };

  if (!activeTableId || tableOrders.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">Không có đơn hàng</h3>
        <p className="text-sm text-muted-foreground/70">
          Chọn bàn và thêm món để bắt đầu đơn hàng
        </p>
      </div>
    );
  }

  const canEdit = currentOrder ? canAddEditDelete(activeTableId, activeOrderId!) : false;
  const canPay = canPayment(activeTableId);

  return (
    <div className="h-full flex flex-col">
      {/* Order Tabs */}
      <div className="flex gap-2 p-4 border-b border-border overflow-x-auto shrink-0">
        {tableOrders.map((order) => {
          const isActive = order.orderId === activeOrderId;
          const isLocked = order.kitchenPrinted;
          
          return (
            <button
              key={order.orderId}
              onClick={() => setActiveOrderId(order.orderId)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
                isLocked && 'opacity-75'
              )}
            >
              {order.tableName} - Đơn {order.orderId}
              {isLocked && <Lock className="w-3 h-3" />}
              <span className="px-1.5 py-0.5 bg-background/20 rounded text-xs">
                {order.items.length}
              </span>
            </button>
          );
        })}
        {/* Add New Order Button */}
        <button
          onClick={handleCreateNewOrder}
          className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all bg-secondary text-muted-foreground hover:text-foreground hover:bg-primary flex items-center gap-2"
          title="Thêm đơn mới"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Order Items */}
      {currentOrder ? (
        <>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {currentOrder.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Không có món trong đơn này
                </div>
              ) : (
                currentOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "p-4 rounded-xl border space-y-3",
                      canEdit ? "bg-secondary/50 border-border" : "bg-muted/30 border-muted opacity-75"
                    )}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">
                          {item.foodName}
                          {item.isUpsized && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                              Tăng size
                            </span>
                          )}
                          {!canEdit && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                              Đã khóa
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-primary font-medium">
                          {formatCurrency(item.unitPrice + (item.isUpsized ? (item.upsizePrice || 0) : 0))}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      {canEdit ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="w-8 text-center font-semibold text-foreground">
                          {item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Toppings */}
                    {item.toppings.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.toppings.map((topping, idx) => (
                          <span key={topping.toppingId || idx} className="px-2 py-1 text-xs bg-muted rounded-md text-muted-foreground">
                            + {topping.name} ({formatCurrency(topping.price)})
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Note */}
                    {item.note && (
                      <p className="text-xs text-muted-foreground italic">
                        📝 {item.note}
                      </p>
                    )}

                    {/* Action Buttons */}
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-9"
                          onClick={() => onAddTopping(activeTableId!, activeOrderId!, item.id)}
                        >
                          <StickyNote className="w-4 h-4 mr-1" />
                          Ghi chú
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Order Summary */}
          <div className="p-4 border-t border-border space-y-4 shrink-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="text-foreground">{formatCurrency(currentOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Giảm giá</span>
                <span className="text-destructive">-{formatCurrency(currentOrder.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span className="text-foreground">Tổng cộng</span>
                <span className="text-primary">{formatCurrency(currentOrder.total)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12"
                onClick={handlePrintKitchen}
                disabled={isLoadingKitchen || currentOrder.items.length === 0 || currentOrder.kitchenPrinted}
              >
                {isLoadingKitchen ? (
                  <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin mr-2" />
                ) : (
                  <Printer className="w-4 h-4 mr-2" />
                )}
                Bếp
                {currentOrder.kitchenPrinted && <Lock className="w-3 h-3 ml-1" />}
              </Button>
              <Button
                className="h-12 gradient-primary text-primary-foreground shadow-button hover:opacity-90"
                onClick={onPayment}
                disabled={!canPay}
                title={!canPay ? 'Tất cả đơn phải được in cho bếp trước khi thanh toán' : ''}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Thanh toán
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-8">
          <p className="text-muted-foreground">Chọn tab đơn để xem chi tiết</p>
        </div>
      )}
    </div>
  );
}
