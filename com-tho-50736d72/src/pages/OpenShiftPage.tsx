import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, DollarSign, Play } from 'lucide-react';
import { useShift } from '@/contexts/ShiftContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyVND } from '@/lib/format';

export default function OpenShiftPage() {
  const [openingAmount, setOpeningAmount] = useState('');
  const { currentShift, openShift } = useShift();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If shift is already open, redirect to orders
  React.useEffect(() => {
    if (currentShift) {
      navigate('/orders');
    }
  }, [currentShift, navigate]);

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(openingAmount) || 0;
    
    if (amount < 0) {
      toast({
        title: 'Số tiền không hợp lệ',
        description: 'Số tiền mở ca phải >= 0',
        variant: 'destructive',
      });
      return;
    }

    openShift(amount);
    toast({
      title: 'Ca đã được mở',
      description: `Ca bắt đầu với ${formatCurrencyVND(amount)}`,
    });
    navigate('/orders');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-4">
            <Clock className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Mở ca làm việc</h1>
          <p className="text-muted-foreground mt-2">Bắt đầu ca làm việc để bắt đầu nhận đơn hàng</p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card">
          <form onSubmit={handleOpenShift} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="opening-amount" className="text-base">
                Số tiền mở ca
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="opening-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value.replace(/\D/g, ''))}
                  className="h-14 text-lg pl-12 pr-16 bg-secondary border-border"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  VND
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Nhập số tiền mặt trong quầy thu ngân khi bắt đầu ca làm việc
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg gradient-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-opacity"
            >
              <Play className="w-5 h-5 mr-2" />
              Mở ca
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-info/10 border border-info/20 rounded-lg">
            <p className="text-sm text-info">
              Sau khi mở ca, bạn có thể bắt đầu nhận đơn hàng. Nhớ đóng ca khi kết thúc công việc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
