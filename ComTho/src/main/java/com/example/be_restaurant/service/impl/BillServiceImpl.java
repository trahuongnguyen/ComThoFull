package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.bean.request.OrderDetailTempRequest;
import com.example.be_restaurant.bean.request.OrderTempRequest;
import com.example.be_restaurant.entity.*;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.mapper.OrderTempMapper;
import com.example.be_restaurant.repository.*;
import com.example.be_restaurant.service.BillService;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.DashedLine;
import com.itextpdf.kernel.pdf.canvas.draw.ILineDrawer;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.printing.PDFPageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.awt.print.PrinterJob;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillServiceImpl implements BillService {

    private final OrderTempRepository orderTempRepository;
    private final FoodRepository foodRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final BillRepository billRepository;
    private final DeskRepository deskRepository;
    private final ShiftRepository shiftRepository;
    private PdfFont currentFont;

    @Override
    @Transactional
    public Bill createBill(Long shiftId, Long deskId, String payment, Double discount) {
        List<OrderTemp> orderTemps = orderTempRepository.findAllByDeskId(deskId);
        if (orderTemps.isEmpty()) {
            throw new NotFoundException("OrderTempNotFound", "Không tìm thấy order temp cho bàn id = " + deskId);
        }

        List<OrderTempRequest> requests = orderTemps.stream()
                .map(OrderTempMapper::toRequest)
                .sorted(Comparator.comparing(OrderTempRequest::getStartTime))
                .toList();

        Order order = new Order();
        order.setStartTime(requests.get(0).getStartTime());
        order.setDesk(deskId);
        order.setDiscount(discount);
        Order savedOrder = orderRepository.save(order);

        for (OrderTempRequest req : requests) {
            for (OrderDetailTempRequest detail : req.getOrderDetails()) {
                OrderDetail od = new OrderDetail();
                Food food = foodRepository.findByIdAndStatus(detail.getFoodId(), true)
                        .orElseThrow(() -> new NotFoundException("FoodNotFound", "Món ăn không tồn tại"));

                od.setFood(food.getName());
                od.setQuantity(detail.getCount());
                od.setUpsizeOption(detail.isCanUpSize());
                od.setOrder(savedOrder);

                List<Food> toppings = foodRepository.findAllByIdInAndStatus(detail.getToppingId(), true);
                od.setTopping(String.join(", ", toppings.stream().map(Food::getName).toList()));

                double amount = food.getPrice() + toppings.stream().mapToDouble(Food::getPrice).sum();
                if (detail.isCanUpSize()) amount += food.getUpSizePrice();
                od.setAmount(amount);

                orderDetailRepository.save(od);
            }
        }

        Bill bill = new Bill();
        bill.setPayment(Bill.Payment.valueOf(payment));
        bill.setOrder(savedOrder);
        bill.setShift(shiftRepository.findById(shiftId).orElseThrow(() -> new NotFoundException("ShiftNotFound", "Lỗi ca")));

        double totalBefore = orderDetailRepository.findAllByOrderId(savedOrder.getId()).stream()
                .mapToDouble(od -> od.getAmount() * od.getQuantity()).sum();

        bill.setTotalBefore(totalBefore);
        bill.setTotalDiscount(discount);
        bill.setTotalAmount(totalBefore - discount);

        Bill savedBill = billRepository.save(bill);
        orderTempRepository.deleteAll(orderTemps);
        return savedBill;
    }

    @Override
    public byte[] generateKitchenInvoicePdf(OrderTempRequest request) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            currentFont = loadFont();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf, new PageSize(164, 2000));
            doc.setMargins(8, 6, 8, 6);

            doc.add(centerBoldBig("PHIẾU BẾP"));
            doc.add(createSeparator(new SolidLine(1f)));

            String deskName = deskRepository.findByIdAndStatus(request.getDeskId(), true)
                    .map(Desk::getName).orElse("N/A");
            doc.add(text("Bàn: " + deskName));
            doc.add(text("Giờ: " + formatHour(request.getStartTime()) + " " + formatDate(request.getStartTime())));
            doc.add(createSeparator(new DashedLine(1f)));

            Table table = new Table(new float[]{1, 7, 2}).useAllAvailableWidth();
            table.addHeaderCell(headerCell("STT"));
            table.addHeaderCell(headerCell("Món"));
            table.addHeaderCell(headerCell("SL"));

            int stt = 1;
            for (OrderDetailTempRequest item : request.getOrderDetails()) {
                table.addCell(itemCell(String.valueOf(stt++), TextAlignment.CENTER));

                Cell nameCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.LEFT);
                String foodName = foodRepository.findByIdAndStatus(item.getFoodId(), true).map(Food::getName).orElse("N/A");
                nameCell.add(new Paragraph(foodName).setFont(currentFont).setFontSize(8).setBold());

                if (item.isCanUpSize()) nameCell.add(subText("+ Up size"));
                if (item.getToppingId() != null && !item.getToppingId().isEmpty()) {
                    foodRepository.findAllByIdInAndStatus(item.getToppingId(), true)
                            .forEach(t -> nameCell.add(subText("- " + t.getName())));
                }
                if (item.getNote() != null && !item.getNote().isBlank()) {
                    nameCell.add(new Paragraph("* " + item.getNote()).setFont(currentFont).setFontSize(7).setItalic());
                }

                table.addCell(nameCell);
                table.addCell(itemCell(String.valueOf(item.getCount()), TextAlignment.CENTER));
                table.addCell(new Cell(1, 3).add(createSeparator(new DashedLine(0.5f))).setBorder(Border.NO_BORDER));
            }

            doc.add(table);
            doc.close();

            byte[] pdfData = baos.toByteArray();
            printPdfSilent(pdfData); // Gửi lệnh in ngầm tới máy in
            return pdfData;

        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo phiếu bếp", e);
        }
    }

    @Override
    public byte[] generatePaymentInvoicePdf(Long billId) {
        Bill bill = billRepository.findByIdWithDetails(billId)
                .orElseThrow(() -> new NotFoundException("BillNotFound", "Không tìm thấy hóa đơn"));

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            currentFont = loadFont();
            Document doc = new Document(new PdfDocument(new PdfWriter(baos)), new PageSize(164, 2000));
            doc.setMargins(8, 6, 8, 6);

            doc.add(centerBoldBig("CƠM THỐ BÁCH KHOA"));
            doc.add(centerSmall("C11-02 Geleximco, Hà Nội\nHotline: 091 409 8386"));
            doc.add(createSeparator(new DashedLine(1f)));

            doc.add(centerBoldBig("HÓA ĐƠN THANH TOÁN"));
            String deskName = deskRepository.findByIdAndStatus(bill.getOrder().getDesk(), true).map(Desk::getName).orElse("N/A");
            doc.add(text("Bàn: " + deskName));
            doc.add(text("Giờ: " + formatHour(bill.getOrder().getStartTime()) + " - " + formatHour(LocalDateTime.now())));
            doc.add(createSeparator(new DashedLine(1f)));

            Table table = new Table(new float[]{1, 5, 1.5f, 2.5f}).useAllAvailableWidth();
            table.addHeaderCell(headerCell("STT"));
            table.addHeaderCell(headerCell("Tên món"));
            table.addHeaderCell(headerCell("SL"));
            table.addHeaderCell(headerCell("Giá"));

            List<OrderDetail> items = orderDetailRepository.findAllByOrderId(bill.getOrder().getId());
            for (int i = 0; i < items.size(); i++) {
                OrderDetail item = items.get(i);
                table.addCell(itemCell(String.valueOf(i + 1), TextAlignment.CENTER));

                Cell nameCell = new Cell().setBorder(Border.NO_BORDER);
                nameCell.add(new Paragraph(item.getFood()).setFont(currentFont).setFontSize(8).setBold());
                if (item.isUpsizeOption()) nameCell.add(subText("+ Up size"));
                if (item.getTopping() != null && !item.getTopping().trim().isEmpty()) nameCell.add(subText("+ " + item.getTopping()));

                table.addCell(nameCell);
                table.addCell(itemCell(String.valueOf(item.getQuantity()), TextAlignment.CENTER));
                table.addCell(itemCell(format(item.getAmount()), TextAlignment.RIGHT));
                if (i < items.size() - 1) table.addCell(new Cell(1, 4).add(createSeparator(new DashedLine(0.5f))).setBorder(Border.NO_BORDER));
            }
            doc.add(table);

            doc.add(createSeparator(new SolidLine(1f)));
            Table footerTable = new Table(new float[]{7, 3}).useAllAvailableWidth();
            footerTable.addCell(labelBoldCell("Tổng:")); footerTable.addCell(valueCell(format(bill.getTotalBefore())));
            footerTable.addCell(labelBoldCell("Giảm:")); footerTable.addCell(valueCell(format(bill.getTotalDiscount())));
            footerTable.addCell(labelBoldCell("THANH TOÁN:")); footerTable.addCell(valueBoldCell(format(bill.getTotalAmount())));
            doc.add(footerTable);

            doc.add(new Paragraph("Cảm ơn quý khách!").setFont(currentFont).setFontSize(8).setItalic().setTextAlignment(TextAlignment.CENTER));
            doc.close();

            byte[] pdfData = baos.toByteArray();
            printPdfSilent(pdfData);
            return pdfData;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo hóa đơn", e);
        }
    }

    private void printPdfSilent(byte[] pdfData) {
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfData))) {
            PrinterJob job = PrinterJob.getPrinterJob();

            if (job.getPrintService() == null) {
                System.err.println("Không tìm thấy máy in mặc định!");
                return;
            }

            // Tạo đối tượng Pageable từ PDF
            PDFPageable pageable = new PDFPageable(document);
            job.setPageable(pageable);

            // Khử răng cưa và ép render chuẩn Unicode
            job.print();

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private PdfFont loadFont() throws Exception {
        try (InputStream fontStream = getClass().getClassLoader().getResourceAsStream("fonts/NotoSans-Regular.ttf")) {
            if (fontStream == null) throw new RuntimeException("Font not found");

            // Đọc font thành mảng byte
            byte[] fontBytes = fontStream.readAllBytes();

            // Quan trọng: Thêm tham số PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED
            // và sử dụng IDENTITY_H để hỗ trợ Unicode hoàn chỉnh
            return PdfFontFactory.createFont(fontBytes, PdfEncodings.IDENTITY_H, PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
        }
    }

    private String formatDate(LocalDateTime t) { return t == null ? "" : t.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")); }
    private String formatHour(LocalDateTime t) { return t == null ? "" : t.format(DateTimeFormatter.ofPattern("HH:mm")); }
    private String format(double v) { return String.format("%,.0f", v); }

    private LineSeparator createSeparator(ILineDrawer line) { return new LineSeparator(line).setMarginTop(2).setMarginBottom(2); }
    private Paragraph text(String t) { return new Paragraph(t).setFont(currentFont).setFontSize(8).setMarginBottom(1); }
    private Paragraph subText(String t) { return new Paragraph(t).setFont(currentFont).setFontSize(7).setItalic().setMultipliedLeading(0.8f); }
    private Paragraph centerSmall(String t) { return new Paragraph(t).setFont(currentFont).setFontSize(7).setTextAlignment(TextAlignment.CENTER); }
    private Paragraph centerBoldBig(String t) { return new Paragraph(t).setFont(currentFont).setFontSize(10).setBold().setTextAlignment(TextAlignment.CENTER); }

    private Cell headerCell(String t) {
        return new Cell().add(new Paragraph(t).setFont(currentFont).setBold().setFontSize(8)).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER);
    }
    private Cell itemCell(String t, TextAlignment align) {
        return new Cell().add(new Paragraph(t).setFont(currentFont).setFontSize(8)).setBorder(Border.NO_BORDER).setTextAlignment(align);
    }
    private Cell labelBoldCell(String t) { return new Cell().add(new Paragraph(t).setFont(currentFont).setFontSize(9).setBold()).setBorder(Border.NO_BORDER); }
    private Cell valueCell(String t) { return new Cell().add(new Paragraph(t).setFont(currentFont).setFontSize(9)).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT); }
    private Cell valueBoldCell(String t) { return new Cell().add(new Paragraph(t).setFont(currentFont).setFontSize(10).setBold()).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT); }
}