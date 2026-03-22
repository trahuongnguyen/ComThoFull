import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle } from 'lucide-react';
import { useShift } from '@/contexts/ShiftContext';
import { useOrder } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableGrid } from '@/components/pos/TableGrid';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { OrderPanel } from '@/components/pos/OrderPanel';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { PrintModal } from '@/components/pos/PrintModal';
import { ToppingModal } from '@/components/pos/ToppingModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function OrderPage() {
  const [activeTab, setActiveTab] = useState<'tables' | 'menu'>('tables');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printPdfBlob, setPrintPdfBlob] = useState<Blob | null>(null);
  const [printTitle, setPrintTitle] = useState('Invoice');
  const [showCloseShiftWarning, setShowCloseShiftWarning] = useState(false);
  const [toppingModal, setToppingModal] = useState<{
    open: boolean;
    tableId: number;
    orderId: number;
    itemId: number;
  }>({ open: false, tableId: 0, orderId: 0, itemId: 0 });

  const { currentShift } = useShift();
  const { getActiveOrders } = useOrder();
  const navigate = useNavigate();

  // Redirect if no shift
  React.useEffect(() => {
    if (!currentShift) {
      navigate('/open-shift');
    }
  }, [currentShift, navigate]);

  const handleTableSelect = (tableId: number) => {
    setActiveTab('menu');
  };

  const handlePrintKitchen = (pdfBlob: Blob) => {
    setPrintPdfBlob(pdfBlob);
    setPrintTitle('Hóa đơn bếp');
    setShowPrintModal(true);
  };

  const handlePrintBill = (pdfBlob: Blob) => {
    setPrintPdfBlob(pdfBlob);
    setPrintTitle('Hóa đơn khách hàng');
    setShowPrintModal(true);
  };

  const handleClosePrintModal = (open: boolean) => {
    setShowPrintModal(open);
    if (!open) {
      setPrintPdfBlob(null);
    }
  };

  const handleCloseShift = () => {
    const activeOrders = getActiveOrders();
    if (activeOrders.length > 0) {
      setShowCloseShiftWarning(true);
    } else {
      navigate('/close-shift');
    }
  };

  if (!currentShift) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">Trạm đặt hàng</h1>
          <div className="px-3 py-1 bg-success/10 border border-success/20 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-success font-medium">Ca đang hoạt động</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleCloseShift}
            className="h-10"
          >
            <Clock className="w-4 h-4 mr-2" />
            Đóng ca
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tables & Menu */}
        <div className="flex-1 flex flex-col border-r border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'tables' | 'menu')} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 pt-4 shrink-0">
              <TabsList className="w-full h-12 bg-secondary p-1">
                <TabsTrigger value="tables" className="flex-1 h-full text-base data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                  Bàn
                </TabsTrigger>
                <TabsTrigger value="menu" className="flex-1 h-full text-base data-[state=active]:gradient-primary data-[state=active]:text-primary-foreground">
                  Thực đơn
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="tables" className="flex-1 overflow-auto p-4 mt-0">
              <TableGrid onTableSelect={handleTableSelect} />
            </TabsContent>
            
            <TabsContent value="menu" className="flex-1 overflow-auto p-4 mt-0">
              <MenuGrid />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Order Details */}
        <div className="w-[420px] flex flex-col overflow-hidden bg-card">
          <OrderPanel
            onPayment={() => setShowPaymentModal(true)}
            onPrintKitchen={handlePrintKitchen}
            onAddTopping={(tableId, orderId, itemId) => setToppingModal({ open: true, tableId, orderId, itemId })}
          />
        </div>
      </div>

      {/* Modals */}
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onPrintBill={handlePrintBill}
      />
      
      <PrintModal
        open={showPrintModal}
        onOpenChange={handleClosePrintModal}
        pdfBlob={printPdfBlob}
        title={printTitle}
      />
      
      <ToppingModal
        open={toppingModal.open}
        onOpenChange={(open) => setToppingModal(prev => ({ ...prev, open }))}
        tableId={toppingModal.tableId}
        orderId={toppingModal.orderId}
        itemId={toppingModal.itemId}
      />

      {/* Close Shift Warning */}
      <AlertDialog open={showCloseShiftWarning} onOpenChange={setShowCloseShiftWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Không thể đóng ca
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn còn đơn hàng chưa thanh toán. Vui lòng hoàn tất tất cả thanh toán trước khi đóng ca.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Đã hiểu</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}