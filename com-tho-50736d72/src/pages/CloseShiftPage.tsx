import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Receipt, Banknote, CreditCard, ArrowLeft, Printer } from 'lucide-react';
import { useShift } from '@/contexts/ShiftContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCurrencyVND } from '@/lib/format';
import { formatDateTimeVN, formatTimeVN } from '@/lib/datetime';

export default function CloseShiftPage() {
  const { currentShift, invoices, closeShift, getShiftSummary } = useShift();
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (!currentShift) {
      navigate('/open-shift');
    }
  }, [currentShift, navigate]);

  if (!currentShift) {
    return null;
  }

  const summary = getShiftSummary();

  const handleConfirmClose = async () => {
    await closeShift();
    toast({
      title: 'Ca đã được đóng',
      description: 'Ca làm việc của bạn đã được đóng thành công.',
    });
    localStorage.removeItem('pos_shift');
    localStorage.removeItem('pos_invoices');
    window.location.reload();
    navigate('/open-shift');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tóm tắt đóng ca</h1>
            <p className="text-muted-foreground mt-1">
              Xem lại hiệu suất ca làm việc trước khi đóng
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/orders')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại đơn hàng
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast({
                  title: 'In báo cáo',
                  description: 'Đang in báo cáo ca làm việc (mô phỏng)',
                });
              }}
            >
              <Printer className="w-4 h-4 mr-2" />
              In báo cáo
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Banknote className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Thanh toán tiền mặt</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrencyVND(summary.totalCash)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-info/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Chuyển khoản ngân hàng</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrencyVND(summary.totalBank)}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Receipt className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-primary">{formatCurrencyVND(summary.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              Hóa đơn ({summary.invoiceCount})
            </h2>
          </div>
          
          <div className="max-h-96 overflow-auto">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Không có hóa đơn trong ca này
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Mã hóa đơn</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Bàn</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Giờ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Phương thức</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-foreground">
                        #{invoice.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {invoice.tableName}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {formatTimeVN(invoice.paidAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.paymentMethod === 'CASH' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-info/10 text-info'
                        }`}>
                          {invoice.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-foreground">
                        {formatCurrencyVND(invoice.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Shift Info */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Thông tin ca làm việc</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Số tiền mở ca</p>
              <p className="font-semibold text-foreground">{formatCurrencyVND(currentShift.startCash)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Số tiền dự kiến trong quầy</p>
              <p className="font-semibold text-foreground">{formatCurrencyVND(currentShift.startCash + summary.totalCash)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Giờ bắt đầu</p>
              <p className="font-semibold text-foreground">{formatDateTimeVN(currentShift.startTime)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Thời lượng</p>
              <p className="font-semibold text-foreground">
                {Math.round((Date.now() - new Date(currentShift.startTime).getTime()) / 1000 / 60)} phút
              </p>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmClose}
          className="w-full h-14 text-lg gradient-primary text-primary-foreground font-semibold shadow-button hover:opacity-90 transition-opacity"
        >
          <Check className="w-5 h-5 mr-2" />
          Xác nhận đóng ca
        </Button>
      </div>
    </div>
  );
}
