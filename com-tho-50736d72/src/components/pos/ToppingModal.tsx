import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useOrder } from '@/contexts/OrderContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderItemTopping } from '@/types';

interface ToppingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: number;
  orderId: number;
  itemId: number;
}

export function ToppingModal({ open, onOpenChange, tableId, orderId, itemId }: ToppingModalProps) {
  const { getOrder, updateItemToppings } = useOrder();
  const { toppings: availableToppings, foodItems } = useRestaurant();

  const order = getOrder(tableId, orderId);
  const item = order?.items.find(i => i.id === itemId);

  const [selectedToppings, setSelectedToppings] = useState<OrderItemTopping[]>([]);
  const [note, setNote] = useState('');
  const [isUpsized, setIsUpsized] = useState(false);

  // Initialize state when modal opens
  useEffect(() => {
    if (open && item) {
      setSelectedToppings(item.toppings || []);
      setNote(item.note || '');
      setIsUpsized(item.isUpsized || false);
    }
  }, [open, item]);

  if (!item) return null;

  const food = foodItems.find(f => f.id === item.foodId);
  const hasUpsizeOption = food?.canUpSize;

  const handleToppingToggle = (topping: typeof availableToppings[0]) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.toppingId === topping.id);
      if (exists) {
        return prev.filter(t => t.toppingId !== topping.id);
      }
      return [...prev, { toppingId: topping.id, name: topping.name, price: topping.price }];
    });
  };

  const handleSave = () => {
    updateItemToppings(tableId, orderId, itemId, selectedToppings, note, isUpsized, food?.upsizePrice);
    onOpenChange(false);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Customize {item.foodName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Toppings */}
          <div className="space-y-3">
            <Label>Add Toppings</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableToppings.map((topping) => {
                const isSelected = selectedToppings.some(t => t.toppingId === topping.id);
                return (
                  <button
                    key={topping.id}
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

          {/* Upsize Option */}
          {hasUpsizeOption && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
              <div>
                <p className="font-medium text-foreground">Upsize</p>
                <p className="text-sm text-muted-foreground">+{formatCurrency(food?.upsizePrice || 0)}</p>
              </div>
              <Switch
                checked={isUpsized}
                onCheckedChange={setIsUpsized}
              />
            </div>
          )}

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="note">Special Instructions</Label>
            <Input
              id="note"
              placeholder="e.g., No onions, extra spicy..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-secondary"
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="gradient-primary text-primary-foreground shadow-button hover:opacity-90"
            >
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
