import React, { useState, useEffect } from 'react';
import { Receipt, Search, Calendar, ChevronDown, ChevronUp, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { shiftsApi } from '@/lib/api';
import { ENABLE_USE_MOCK_DATA, fetchPageWithMockFallback, getMockShiftDetail, MOCK_SHIFTS } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { Shift, ShiftDetailResponse } from '@/types';

// // Mock shift
// const MOCK_SHIFT = Array.from({ length: 20 }, (_, i) => ({
//   id: `INV-${String(i + 1).padStart(4, '0')}`,
//   tableName: `Table ${(i % 8) + 1}`,
//   items: [
//     { name: 'Beef Rice Bowl', quantity: 2, price: 65000 },
//     { name: 'Iced Coffee', quantity: 2, price: 25000 },
//     { name: 'Fried Egg', quantity: 2, price: 8000, isTopping: true },
//   ],
//   subtotal: 196000,
//   discount: i % 3 === 0 ? 19600 : 0,
//   total: i % 3 === 0 ? 176400 : 196000,
//   paymentMethod: i % 2 === 0 ? 'CASH' : 'CARD' as 'CASH' | 'CARD',
//   staffName: i % 2 === 0 ? 'John Staff' : 'Administrator',
//   paidAt: new Date(Date.now() - i * 3600000 * 2),
// }));

// Mock invoices
// const MOCK_INVOICES = Array.from({ length: 20 }, (_, i) => ({
//   id: `INV-${String(i + 1).padStart(4, '0')}`,
//   tableName: `Table ${(i % 8) + 1}`,
//   items: [
//     { name: 'Beef Rice Bowl', quantity: 2, price: 65000 },
//     { name: 'Iced Coffee', quantity: 2, price: 25000 },
//     { name: 'Fried Egg', quantity: 2, price: 8000, isTopping: true },
//   ],
//   subtotal: 196000,
//   discount: i % 3 === 0 ? 19600 : 0,
//   total: i % 3 === 0 ? 176400 : 196000,
//   paymentMethod: i % 2 === 0 ? 'CASH' : 'CARD' as 'CASH' | 'CARD',
//   staffName: i % 2 === 0 ? 'John Staff' : 'Administrator',
//   paidAt: new Date(Date.now() - i * 3600000 * 2),
// }));

export default function InvoicesPage() {
  const [timeRange, setTimeRange] = useState('7');
  // const [searchInvoiceQuery, setSearchInvoiceQuery] = useState('');
  const [searchShiftQuery, setSearchShiftQuery] = useState('');
  // const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);
  const [expandedShift, setExpandedShift] = useState<number | null>(null);
  const [shiftDetail, setShiftDetail] = useState<ShiftDetailResponse | null>(null);
  // const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const calculateTimeRange = () => {
    if(timeRange === '1' || timeRange === 'today') {
      return '1';
    } else if(timeRange === '7' || timeRange === 'week') {
      return '7';
    } else if(timeRange === '30' || timeRange === 'month') {
      return '30';
    }
    return timeRange;
  };

  // Fetch shifts when page, size, or timeRange changes
  useEffect(() => {
    const fetShifts = async () => {
      setIsLoading(true);
      try {
        const timeRangeValue = calculateTimeRange();
        const { page: pageData, fromMock } = await fetchPageWithMockFallback(
          () => shiftsApi.getAll(timeRangeValue, page, size),
          MOCK_SHIFTS,
          page,
          size
        );
        setShifts(pageData.content);
        setTotalPages(pageData.totalPages);
        setTotalElements(pageData.totalElements);
        if (!fromMock) {
          if (pageData.number !== page) setPage(pageData.number);
          if (pageData.size !== size) setSize(pageData.size);
        }
      } catch {
        toast({
          title: 'Lỗi tải dữ liệu',
          description: 'Không thể kết nối đến dịch vụ',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetShifts();
  }, [page, size, timeRange, toast]);

  // const filteredInvoices = invoices.filter(inv =>
  //   inv.id.toString().toLowerCase().includes(searchInvoiceQuery.toLowerCase()) ||
  //   // inv.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   inv.staffName.toLowerCase().includes(searchInvoiceQuery.toLowerCase())
  // );

  const filterShifts = shifts;
  // .filter(shift =>
  //   shift.status.toUpperCase().includes(searchShiftQuery.toUpperCase())
  // );

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VND';
  };

  // const handlePrintInvoice = async (invoice: Invoice) => {
  //   try {
  //     // For real implementation, call the invoice PDF API
  //     // Since we don't have individual invoice PDF endpoint, we'll use the bill creation endpoint
  //     // This assumes the invoice has the necessary shiftId and deskId information

  //     toast({
  //       title: 'Print Invoice',
  //       description: `Printing invoice ${invoice.id}`,
  //     });

  //     // Uncomment when you have the proper API endpoint:
  //     const { data: pdfBlob, error } = await invoicesApi.createBill(
  //       invoice.shiftId,
  //       invoice.deskId,
  //       invoice.paymentMethod
  //     );

  //     if (pdfBlob && !error) {
  //       printPdfBlob(pdfBlob, `Invoice-${invoice.id}`);
  //       toast({
  //         title: 'Invoice printed',
  //         description: 'Invoice sent to printer',
  //       });
  //     } else {
  //       toast({
  //         title: 'Print failed',
  //         description: error || 'Failed to generate invoice',
  //         variant: 'destructive',
  //       });
  //     }
  //   } catch (error) {
  //     toast({
  //       title: 'Print failed',
  //       description: 'Something went wrong while printing',
  //       variant: 'destructive',
  //     });
  //   }
  // };

  const handleChangeTimeRange = (newTimeRange: string) => {
    setTimeRange(newTimeRange);
    setPage(0); // Reset to first page when changing time range
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  }

  const handleSizeChange = (newSize: string) => {
    setSize(parseInt(newSize));
    setPage(0); // Reset to first page when changing page size
  }

  // const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalShiftRevenue = filterShifts.reduce((sum, sft) => sum + sft.endCash - sft.startCash, 0);

  const handleChangeExpandedShift = async (id: number) => {
    if (expandedShift === id) {
      setExpandedShift(null);
      setShiftDetail(null);
      return;
    }
    try {
      if (ENABLE_USE_MOCK_DATA) {
        setShiftDetail(getMockShiftDetail(id));
        setExpandedShift(id);
        return;
      }
      const { data, error } = await shiftsApi.getById(id);
      if (data && !error) {
        setShiftDetail(data);
        setExpandedShift(id);
      } else {
        setShiftDetail(getMockShiftDetail(id));
        setExpandedShift(id);
      }
    } catch {
      setShiftDetail(getMockShiftDetail(id));
      setExpandedShift(id);
    }
  };

  return (
    <div className="p-6 overflow-auto h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            {/* <h1 className="text-3xl font-bold text-foreground">Invoices</h1> */}
            <h1 className="text-3xl font-bold text-foreground">Ca làm việc</h1>
            {/* <p className="text-muted-foreground">View and manage all invoices</p> */}
            <p className="text-muted-foreground">Xem và quản lý ca làm việc</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              {/* <Input
                placeholder="Search invoices..."
                value={searchInvoiceQuery}
                onChange={(e) => setSearchInvoiceQuery(e.target.value)}
                className="pl-10 w-64 bg-secondary"
              /> */}
              <Input
                placeholder="Tìm kiếm..."
                value={searchShiftQuery}
                onChange={(e) => setSearchShiftQuery(e.target.value)}
                className="pl-10 w-64 bg-secondary"
              />
            </div>
            <Select value={timeRange} onValueChange={handleChangeTimeRange}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Hôm nay</SelectItem>
                <SelectItem value="7">Tuần này</SelectItem>
                <SelectItem value="30">Tháng này</SelectItem>
                {/* <SelectItem value="year">Năm nay</SelectItem> */}
              </SelectContent>
            </Select>
            <Select value={size.toString()} onValueChange={handleSizeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
                <SelectItem value="50">50 / trang</SelectItem>
                <SelectItem value="100">100 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold text-foreground">{filteredInvoices.length}</p>
          </div> */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Tổng số ca</p>
            <p className="text-2xl font-bold text-foreground">{filterShifts.length}</p>
          </div>
          {/* <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalRevenue)}</p>
          </div> */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalShiftRevenue)}</p>
          </div>
          {/* <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Average Order</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(Math.round(totalRevenue / filteredInvoices.length || 0))}
            </p>
          </div> */}
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-sm text-muted-foreground">Trung bình/Hóa đơn</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(Math.round(totalShiftRevenue / filterShifts.length || 0))}
            </p>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                {/* <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Invoice ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Table</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Staff</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Payment</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr> */}
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Mã ca</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Mã nhân viên</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Tiền mở ca</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Tiền đóng ca</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase">Giờ mở ca</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase">Giờ đóng ca</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  // <tr>
                  //   <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  //     <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                  //     Loading invoices...
                  //   </td>
                  // </tr>
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                  // ) : filteredInvoices.length === 0 ? (
                ) : filterShifts.length === 0 ? (
                  // <tr>
                  //   <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  //     No invoices found
                  //   </td>
                  // </tr>
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                      Không tìm thấy ca làm việc
                    </td>
                  </tr>
                ) : (
                  // filteredInvoices.map((invoice) => (
                  filterShifts.map((shift) => (
                    // <React.Fragment key={invoice.id}>
                    //   <tr className="hover:bg-muted/30 transition-colors">
                    //     <td className="px-6 py-4 text-sm font-mono text-foreground">{invoice.id}</td>
                    //     <td className="px-6 py-4 text-sm text-foreground"></td>
                    //     <td className="px-6 py-4 text-sm text-muted-foreground">{invoice.staffName}</td>
                    //     <td className="px-6 py-4 text-sm text-muted-foreground">
                    //       {invoice.paidAt.toLocaleDateString()} {invoice.paidAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    //     </td>
                    //     <td className="px-6 py-4">
                    //       <span className={cn(
                    //         'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                    //         invoice.paymentMethod === 'CASH'
                    //           ? 'bg-success/10 text-success'
                    //           : 'bg-info/10 text-info'
                    //       )}>
                    //         {invoice.paymentMethod === 'CASH' ? 'Cash' : 'Bank'}
                    //       </span>
                    //     </td>
                    //     <td className="px-6 py-4 text-sm text-right font-semibold text-foreground">
                    //       {formatCurrency(invoice.totalAmount)}
                    //     </td>
                    //     <td className="px-6 py-4 text-center">
                    //       <div className="flex items-center justify-center gap-2">
                    //         <button
                    //           onClick={() => handlePrintInvoice(invoice)}
                    //           className="p-2 rounded-lg hover:bg-muted transition-colors"
                    //           title="Print Invoice"
                    //         >
                    //           <Printer className="w-4 h-4 text-muted-foreground" />
                    //         </button>
                    //         <button
                    //           onClick={() => setExpandedInvoice(expandedInvoice === invoice.id ? null : invoice.id)}
                    //           className="p-2 rounded-lg hover:bg-muted transition-colors"
                    //           title="View Details"
                    //         >
                    //           {expandedInvoice === invoice.id ? (
                    //             <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    //           ) : (
                    //             <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    //           )}
                    //         </button>
                    //       </div>
                    //     </td>
                    //   </tr>
                    //   {expandedInvoice === invoice.id && (
                    //     <tr>
                    //       <td colSpan={7} className="px-6 py-4 bg-muted/20">
                    //         <div className="space-y-4">
                    //           <h4 className="font-semibold text-foreground">Order Details</h4>
                    //           <div className="space-y-2">
                    //             {invoice.items.map((item, idx) => (
                    //               <div key={idx} className="flex justify-between text-sm">
                    //                 <span className="text-foreground">
                    //                   {/* {item.isTopping && '+ '} */}
                    //                   {item.quantity}x {item.foodName}
                    //                 </span>
                    //                 {item.toppings.map((topping, i) => (
                    //                   <span className='text-muted-foreground pl-4'>+ {topping.name}</span>
                    //                 ))}
                    //                 <span className="text-foreground">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    //               </div>
                    //             ))}
                    //           </div>
                    //           <div className="pt-3 border-t border-border space-y-1">
                    //             <div className="flex justify-between text-sm">
                    //               <span className="text-muted-foreground">Subtotal</span>
                    //               <span className="text-foreground">{formatCurrency(invoice.totalBefore)}</span>
                    //             </div>
                    //             {invoice.totalDiscount > 0 && (
                    //               <div className="flex justify-between text-sm">
                    //                 <span className="text-muted-foreground">Discount</span>
                    //                 <span className="text-destructive">-{formatCurrency(invoice.totalDiscount)}</span>
                    //               </div>
                    //             )}
                    //             <div className="flex justify-between font-semibold">
                    //               <span className="text-foreground">Total</span>
                    //               <span className="text-primary">{formatCurrency(invoice.totalAmount)}</span>
                    //             </div>
                    //           </div>
                    //         </div>
                    //       </td>
                    //     </tr>
                    //   )}
                    // </React.Fragment>
                    <React.Fragment key={shift.id}>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-foreground">{shift.id}</td>
                        <td className="px-6 py-4 text-sm text-foreground">{shift.userId}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatCurrency(shift.startCash)}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatCurrency(shift.endCash)}</td>
                        <td className="px-6 py-4">
                          {shift.startTime?.toString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-foreground">
                          {shift.endTime?.toString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleChangeExpandedShift(shift.id)}
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                              title="Xem chi tiết"
                            >
                              {expandedShift === shift.id ? (
                                <ChevronUp className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedShift === shift.id && shiftDetail && (
                        <tr>
                          <td colSpan={12} className="px-6 py-4 bg-muted/20">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-foreground">Doanh thu: {formatCurrency(shiftDetail.totalRevenue)} / {shiftDetail.totalProductQuantity} món</h4>
                              <table className="w-full">
                                <thead>
                                  <tr>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">Tên</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">Số lượng</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">Tổng tiền</td>
                                  </tr>
                                </thead>
                                <tbody>
                                  {shiftDetail.products.map((pro) => (
                                    <tr key={'PRODUCT-' + pro.name}>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">{pro.name}</td>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">{pro.quantity}</td>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">{formatCurrency(pro.total)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <h4 className="font-semibold text-foreground">Khuyến mãi: {shiftDetail.promotions?.length ? shiftDetail.promotions.length : 0}</h4>
                              {!!shiftDetail.promotions?.length && (
                                <table className="w-full">
                                  <thead>
                                    <tr>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">Tên</td>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">Số lượng</td>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">Tổng tiền</td>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {shiftDetail.promotions.map((pro) => (
                                      <tr key={'PROMOTION-' + pro.name}>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{pro.name}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{pro.quantity}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatCurrency(pro.total)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                              <h4 className="font-semibold text-foreground">Hình thức thanh toán: {shiftDetail.payments?.length ? shiftDetail.payments.length : 0}</h4>
                              {!!shiftDetail.payments?.length && (
                                <table className="w-full">
                                  <thead>
                                    <tr>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">Phương thức</td>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">Số lượng</td>
                                      <td className="px-6 py-4 text-sm text-muted-foreground">Tổng tiền</td>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {shiftDetail.payments.map((pay) => (
                                      <tr key={'PAYMENT-' + pay.method}>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{pay.method}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{pay.count}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatCurrency(pay.total)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Hiển thị {page * size + 1} - {Math.min((page + 1) * size, totalElements)} trong tổng số {totalElements} ca
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="gap-1 pl-2.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Trước</span>
                    </Button>
                  </PaginationItem>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (page < 3) {
                      pageNum = i;
                    } else if (page > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={page === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="gap-1 pr-2.5"
                    >
                      <span>Sau</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
