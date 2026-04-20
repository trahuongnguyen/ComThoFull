import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useOrder } from '@/contexts/OrderContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ToppingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: number;
  orderId: number;
  itemId: number;
}

/**
 * Ghi chú / tùy chọn size cho món.
 *
 * [TẠM TẮT] Chọn topping từ danh sách — bỏ comment khối "TOPPING (tạm tắt)" bên dưới khi cần bật lại.
 */
export function ToppingModal({ open, onOpenChange, tableId, orderId, itemId }: ToppingModalProps) {
  const { getOrder, updateItemToppings } = useOrder();
  const { foodItems } = useRestaurant();

  const order = getOrder(tableId, orderId);
  const item = order?.items.find(i => i.id === itemId);

  const [note, setNote] = useState('');
  const [isUpsized, setIsUpsized] = useState(false);

  useEffect(() => {
    if (open && item) {
      setNote(item.note || '');
      setIsUpsized(item.isUpsized || false);
    }
  }, [open, item]);

  if (!item) return null;

  const food = foodItems.find(f => f.id === item.foodId);
  const hasUpsizeOption = food?.canUpSize;

  const handleSave = () => {
    /* Giữ toppings hiện có trên item (không chỉnh từ UI); chỉ cập nhật note + upsize */
    updateItemToppings(tableId, orderId, itemId, item.toppings || [], note, isUpsized, food?.upsizePrice);
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Ghi chú — {item.foodName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/*
            ─── TOPPING (tạm tắt) — bỏ comment cả khối khi bật lại tính năng topping ───
            Cần thêm lại: import OrderItemTopping, availableToppings từ useRestaurant,
            state selectedToppings + handleToppingToggle, và truyền selectedToppings vào updateItemToppings.

          <div className="space-y-3">
            <Label>Thêm topping</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableToppings.map((topping) => {
                const isSelected = selectedToppings.some(t => t.toppingId === topping.id);
                return (
                  <button
                    key={topping.id}
                    type="button"
                    onClick={() => handleToppingToggle(topping)}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <span className="text-sm font-medium text-foreground">{topping.name}</span>
                    </div>
                    <span className="text-xs text-primary">+{formatCurrency(topping.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
          ─── /TOPPING ───
          */}

          {hasUpsizeOption && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div>
                <p className="font-medium text-foreground">Tăng size</p>
                <p className="text-sm text-muted-foreground">+{formatCurrency(food?.upsizePrice || 0)}</p>
              </div>
              <Switch
                checked={isUpsized}
                onCheckedChange={setIsUpsized}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú món</Label>
            <Input
              id="note"
              placeholder="VD: Ít đường, không hành…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              className="gradient-primary text-primary-foreground shadow-button hover:opacity-90"
            >
              <Check className="w-4 h-4 mr-2" />
              Lưu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
