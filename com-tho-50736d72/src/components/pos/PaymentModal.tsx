import React, { useState } from 'react';
import { CreditCard, Banknote, Percent, DollarSign, Check } from 'lucide-react';
import { useOrder } from '@/contexts/OrderContext';
import { useShift } from '@/contexts/ShiftContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { invoicesApi } from '@/lib/api';
import { formatCurrencyVND } from '@/lib/format';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bill } from '@/types';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrintBill: (pdfBlob: Blob) => void;
}

export function PaymentModal({ open, onOpenChange, onPrintBill }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { activeTableId, getTableOrders, completeOrder } = useOrder();
  const { currentShift, addInvoice, updateEndCash } = useShift();
  const { updateTableStatus } = useRestaurant();
  const { user } = useAuth();
  const { toast } = useToast();

  const tableOrders = activeTableId ? getTableOrders(activeTableId) : [];
  const tableName = tableOrders.length > 0 ? tableOrders[0].tableName : '';

  const calculateTotal = () => {
    if (tableOrders.length === 0) return { subtotal: 0, discount: 0, total: 0 };

    // Sum all orders
    const subtotal = tableOrders.reduce((sum, order) => sum + order.subtotal, 0);
    let discount = 0;

    const value = parseFloat(discountValue) || 0;
    if (discountType === 'percentage') {
      discount = subtotal * (Math.min(value, 100) / 100);
    } else {
      discount = Math.min(value, subtotal);
    }

    return {
      subtotal,
      discount,
      total: subtotal - discount,
    };
  };

  const totals = calculateTotal();


  const handlePayment = async () => {
    if (!activeTableId || tableOrders.length === 0 || !currentShift || !user) return;

    setIsProcessing(true);

    try {
      // Call API to create bill and get PDF (combine all orders)
      const { data: pdfBlob, error } = await invoicesApi.createBill(
        currentShift.id!,
        activeTableId,
        paymentMethod,
        totals.discount
      );

      if (error) {
        toast({
          title: 'Thanh toán thất bại',
          description: error,
          variant: 'destructive',
        });
        return;
      }

      // Complete all orders locally
      const completedOrders = completeOrder(
        activeTableId,
        paymentMethod,
        discountValue ? discountType : undefined,
        discountValue ? parseFloat(discountValue) : undefined
      );

      if (!completedOrders || completedOrders.length === 0) {
        throw new Error('Failed to complete orders');
      }

      // Create invoice record locally (combine all orders)
      const allItems = completedOrders.flatMap(o => o.items);
      const invoice: Bill = {
        id: 0,
        orderId: completedOrders[0].id,
        shiftId: currentShift.id!,
        deskId: activeTableId,
        tableName: completedOrders[0].tableName,
        items: allItems,
        subtotal: totals.subtotal,
        discountAmount: totals.discount,
        total: totals.total,
        paymentMethod,
        paidAt: new Date(),
        staffName: user.fullName,
      };

      addInvoice(invoice);
      updateTableStatus(activeTableId, 'AVAILABLE');

      // Update endCash of current shift (localStorage only, API called on close shift)
      updateEndCash(totals.total);

      toast({
        title: 'Thanh toán thành công',
        description: `Đã nhận ${formatCurrencyVND(totals.total)} qua ${paymentMethod === 'CASH' ? 'tiền mặt' : 'chuyển khoản'}`,
      });

      // Reset form and close modal
      setDiscountValue('');
      setPaymentMethod('CASH');
      onOpenChange(false);

      // Open print modal with the PDF
      if (pdfBlob) {
        onPrintBill(pdfBlob);
      }
    } catch (error) {
      toast({
        title: 'Thanh toán thất bại',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (tableOrders.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby='' className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Thanh toán - {tableName} ({tableOrders.length} đơn)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Phương thức thanh toán</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={cn(
                  'flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                  paymentMethod === 'CASH'
                    ? 'border-success bg-success/10 text-success'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                <Banknote className="w-5 h-5" />
                <span className="font-medium">Tiền mặt</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={cn(
                  'flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                  paymentMethod === 'CARD'
                    ? 'border-info bg-info/10 text-info'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Chuyển khoản</span>
              </button>
            </div>
          </div>

          {/* Discount */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Giảm giá</Label>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm', discountType !== 'percentage' && 'text-muted-foreground')}>%</span>
                <Switch
                  checked={discountType === 'fixed'}
                  onCheckedChange={(checked) => setDiscountType(checked ? 'fixed' : 'percentage')}
                />
                <span className={cn('text-sm', discountType !== 'fixed' && 'text-muted-foreground')}>VND</span>
              </div>
            </div>
            <div className="relative">
              {discountType === 'percentage' ? (
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              ) : (
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              )}
              <Input
                type="number"
                placeholder={discountType === 'percentage' ? '0 - 100' : '0'}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="h-12 pl-10 bg-secondary"
                max={discountType === 'percentage' ? 100 : undefined}
                min={0}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 bg-muted/50 rounded-xl space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="text-foreground">{formatCurrencyVND(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Giảm giá</span>
              <span className="text-destructive">-{formatCurrencyVND(totals.discount)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-3 border-t border-border">
              <span className="text-foreground">Tổng cộng</span>
              <span className="text-primary">{formatCurrencyVND(totals.total)}</span>
            </div>
          </div>

          {/* Confirm Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full h-12 gradient-primary text-primary-foreground font-semibold shadow-button hover:opacity-90"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Xác nhận thanh toán
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}