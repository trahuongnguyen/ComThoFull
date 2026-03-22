package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.bean.request.OrderDetailTempRequest;
import com.example.be_restaurant.bean.request.OrderTempRequest;
import com.example.be_restaurant.entity.*;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.mapper.OrderTempMapper;
import com.example.be_restaurant.repository.*;
import com.example.be_restaurant.service.BillService;
import com.itextpdf.io.font.FontProgram;
import com.itextpdf.io.font.FontProgramFactory;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.DashedLine;
import com.itextpdf.kernel.pdf.canvas.draw.ILineDrawer;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.DashedBorder;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BillServiceImpl implements BillService {
    private final OrderTempRepository orderTempRepository;
    private final FoodRepository foodRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final BillRepository billRepository;
    private final DeskRepository deskRepository;
    private final ShiftRepository shiftRepository;

    @Override
    @Transactional
    public Bill createBill(Long shiftId, Long deskId, String payment, Double discount) {
        List<OrderTemp> orderTemp = orderTempRepository.findAllByDeskId(deskId);
        if (orderTemp.isEmpty()){
            throw new NotFoundException("OrderTempNotFound",
                    "Không tìm thấy order temp cho bàn id = " + deskId);
        }
        List<OrderTempRequest> orderTempRequests = orderTemp.stream()
                .map(OrderTempMapper::toRequest)
                .toList();
        orderTempRequests = orderTempRequests.stream()
                .sorted(Comparator.comparing(OrderTempRequest::getStartTime))
                .toList();
        Order order = new Order();
        order.setStartTime(orderTempRequests.get(0).getStartTime());
        order.setDesk(deskId);
        order.setDiscount(discount);
        Order saveOrder = orderRepository.save(order);
        for (OrderTempRequest orderTempRequest : orderTempRequests) {
            for (OrderDetailTempRequest detailTempRequest : orderTempRequest.getOrderDetails()) {
                OrderDetail orderDetail = new OrderDetail();
                Optional<Food> food = foodRepository.findByIdAndStatus(detailTempRequest.getFoodId(), true);
                orderDetail.setFood(food.map(Food::getName).orElse("Unknown Food"));
                orderDetail.setQuantity(detailTempRequest.getCount());
                orderDetail.setUpsizeOption(detailTempRequest.isCanUpSize());
                List<Food> toppingFoods = foodRepository.findAllByIdInAndStatus(detailTempRequest.getToppingId(), true);
                orderDetail.setTopping(String.join(", ", toppingFoods.stream().map(Food::getName).toList()));
                orderDetail.setOrder(saveOrder);
                orderDetail.setAmount(food.map(Food::getPrice).orElse(0.0) +
                        toppingFoods.stream().mapToDouble(Food::getPrice).sum() +
                        (detailTempRequest.isCanUpSize() ? food.map(Food::getUpSizePrice).orElse(0.0) : 0.0));
                orderDetailRepository.save(orderDetail);
            }
        }
        Bill bill = new Bill();
        bill.setPayment(Bill.Payment.valueOf(payment));
        bill.setOrder(saveOrder);
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() ->
                        new NotFoundException("ShiftNotFound",
                                "Không tìm thấy ca làm việc id = " + shiftId));
        bill.setShift(shift);
        bill.setTotalBefore(
                orderDetailRepository.findAllByOrderId(saveOrder.getId()).stream()
                        .mapToDouble(od -> od.getAmount() * od.getQuantity())
                        .sum()
        );
        bill.setTotalDiscount(saveOrder.getDiscount());
        bill.setTotalAmount(bill.getTotalBefore() - bill.getTotalDiscount());
        Bill saveBill = billRepository.save(bill);
        orderTempRepository.deleteAll(orderTemp);
        return saveBill;
    }

    @Override
    public byte[] generateKitchenInvoicePdf(OrderTempRequest request) {

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // ===== UNICODE FONT =====
//            PdfFont font = PdfFontFactory.createFont(
//                    Objects.requireNonNull(
//                            getClass().getClassLoader()
//                                    .getResource("fonts/NotoSans-Regular.ttf")
//                    ).getPath(),
//                    PdfEncodings.IDENTITY_H
//            );
            InputStream fontStream = getClass().getClassLoader().getResourceAsStream("fonts/NotoSans-Regular.ttf");
            FontProgram fontProgram = FontProgramFactory.createFont(fontStream.readAllBytes());
            PdfFont font = PdfFontFactory.createFont(fontProgram);

            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);

            // 58mm – chiều cao lớn (bill ngắn KHÔNG bị kéo dài khi in nhiệt)
            Document doc = new Document(pdf, new PageSize(164, 2000));
            doc.setMargins(8, 6, 8, 6);
            doc.setFont(font);

            // ===== HEADER =====
            doc.add(new Paragraph("PHIẾU BẾP")
                    .setBold()
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER));

            addFullLine(doc);
            String deskName = deskRepository.findByIdAndStatus(request.getDeskId(), true)
                    .map(Desk::getName)
                    .orElse("Không rõ bàn");

            doc.add(new Paragraph("Bàn: " + deskName).setFontSize(9));
            doc.add(new Paragraph(
                    "Giờ vào: " +
                            formatHour(request.getStartTime()) + " " +
                            formatDate(request.getStartTime()))
                    .setFontSize(9));

            addFullLine(doc);

            // ===== TABLE =====
            Table table = new Table(new float[]{1, 6, 1});
            table.setWidth(UnitValue.createPercentValue(100));
            table.setBorder(Border.NO_BORDER);

            table.addHeaderCell(headerKitchen("STT"));
            table.addHeaderCell(headerKitchen("Món"));
            table.addHeaderCell(headerKitchen("SL"));
            table.addCell(separatorKitchen());

            int stt = 1;

            for (OrderDetailTempRequest item : request.getOrderDetails()) {

                String foodName = foodRepository
                        .findByIdAndStatus(item.getFoodId(), true)
                        .map(Food::getName)
                        .orElse("Không rõ món");

                // ===== DÒNG MÓN =====
                table.addCell(sttCellKitchen(stt++));
                table.addCell(foodCellKitchen(foodName));
                table.addCell(slCellKitchen(item.getCount()));

                // ===== UP SIZE =====
                if (item.isCanUpSize()) {
                    table.addCell(emptyKitchen());
                    table.addCell(optionKitchen("+ Up size"));
                    table.addCell(emptyKitchen());
                }

                // ===== TOPPING =====
                if (item.getToppingId() != null && !item.getToppingId().isEmpty()) {

                    table.addCell(emptyKitchen());
                    table.addCell(optionKitchen("+ Topping:"));
                    table.addCell(emptyKitchen());

                    List<String> toppings = foodRepository
                            .findAllByIdInAndStatus(item.getToppingId(), true)
                            .stream()
                            .map(Food::getName)
                            .toList();

                    for (String t : toppings) {
                        table.addCell(emptyKitchen());
                        table.addCell(subOptionKitchen("- " + t));
                        table.addCell(emptyKitchen());
                    }
                }

                // ===== GHI CHÚ =====
                if (item.getNote() != null && !item.getNote().isBlank()) {
                    table.addCell(emptyKitchen());
                    table.addCell(subOptionKitchen("* " + item.getNote()));
                    table.addCell(emptyKitchen());
                }

                // ===== LINE NGĂN MÓN =====
                table.addCell(separatorKitchen());
            }

            doc.add(table);
            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo PDF phiếu bếp", e);
        }
    }
    // ===== HEADER CELL =====
    private Cell headerKitchen(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold().setFontSize(8))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(Border.NO_BORDER);
    }

    // ===== BASIC CELLS =====
    private Cell sttCellKitchen(int v) {
        return new Cell()
                .add(new Paragraph(String.valueOf(v)).setFontSize(7))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(Border.NO_BORDER);
    }

    private Cell slCellKitchen(int v) {
        return new Cell()
                .add(new Paragraph(String.valueOf(v)).setFontSize(7))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(Border.NO_BORDER);
    }

    private Cell foodCellKitchen(String t) {
        return new Cell()
                .add(new Paragraph(t).setFontSize(8))
                .setBorder(Border.NO_BORDER);
    }

    // ===== OPTION =====
    private Cell optionKitchen(String t) {
        return new Cell()
                .add(new Paragraph("  " + t).setFontSize(7))
                .setBorder(Border.NO_BORDER);
    }

    private Cell subOptionKitchen(String t) {
        return new Cell()
                .add(new Paragraph("    " + t).setFontSize(7))
                .setBorder(Border.NO_BORDER);
    }

    private Cell emptyKitchen() {
        return new Cell().setBorder(Border.NO_BORDER);
    }

    // ===== SEPARATOR (FULL WIDTH TABLE) =====
    private Cell separatorKitchen() {
        return new Cell(1, 3)
                .setBorderTop(new SolidBorder(0.5f))
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER);
    }

    // ===== FULL LINE (HEADER / FOOTER) =====
    private void addFullLine(Document doc) {
        Table t = new Table(1);
        t.setWidth(UnitValue.createPercentValue(100));
        t.addCell(new Cell()
                .setBorderTop(new SolidBorder(1))
                .setBorderLeft(Border.NO_BORDER)
                .setBorderRight(Border.NO_BORDER)
                .setBorderBottom(Border.NO_BORDER)
                .setHeight(5));
        doc.add(t);
    }


//    @Override
//    public byte[] generatePaymentInvoicePdf(Long billId) {
//
//        Bill bill = billRepository.findByIdWithDetails(billId)
//                .orElseThrow(() ->
//                        new NotFoundException("BillNotFound",
//                                "Không tìm thấy hóa đơn id = " + billId));
//
//        Order order = bill.getOrder();
//        List<OrderDetail> items = orderDetailRepository.findAllByOrderId(order.getId());
//        //List<OrderDetail> items = order.getOrderDetails();
//
//        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
//
//            // ===== LOAD UNICODE FONT (CÁCH ĐÚNG) =====
//            InputStream fontStream = getClass().getClassLoader().getResourceAsStream("fonts/NotoSans-Regular.ttf");
//            if (fontStream == null) { throw new RuntimeException("Không tìm thấy font NotoSans-Regular.ttf"); }
//            FontProgram fontProgram = FontProgramFactory.createFont(fontStream.readAllBytes());
//            PdfFont font = PdfFontFactory.createFont(fontProgram);
//
//            PdfWriter writer = new PdfWriter(baos);
//            PdfDocument pdf = new PdfDocument(writer);
//
//            Document doc = new Document(pdf, receiptPage());
//            doc.setMargins(8, 6, 8, 6);
//            doc.setFont(font);
//
//            printStoreInfo(doc);
//            printBillInfo(doc, order);
//            printItems(doc, items);
//            printTotal(doc, bill);
//            printFooter(doc);
//
//            doc.close();
//            return baos.toByteArray();
//
//        } catch (Exception e) {
//            e.printStackTrace();
//            throw new RuntimeException("Lỗi khi tạo hóa đơn PDF", e);
//        }
//    }
//
//    // ================= PAGE =================
//
//    private PageSize receiptPage() {
//        // 58mm printer
//        return new PageSize(164, 2000);
//    }
//
//    // ================= STORE =================
//
//    private void printStoreInfo(Document doc) {
//
//        doc.add(centerBoldBig("CƠM THỐ BÁCH KHOA"));
//
//        doc.add(centerSmall(
//                "C11-02 Geleximco\nĐ. Lê Trọng Tấn, Hà Nội"));
//
//        doc.add(centerSmall("Hotline: 091 409 8386"));
//
//        doc.add(fullLine());
//    }
//
//    // ================= BILL INFO =================
//
//    private void printBillInfo(Document doc, Order order) {
//
//        doc.add(centerBoldBig("HÓA ĐƠN THANH TOÁN"));
//
//        doc.add(text("Bàn: " + order.getDesk()));
//
//        doc.add(text("Ngày: " + formatDate(order.getStartTime())));
//
//        doc.add(text("Giờ: "
//                + formatHour(order.getStartTime())
//                + " - "
//                + formatHour(order.getEndTime())));
//
//        doc.add(fullLine());
//    }
//
//    // ================= ITEMS =================
//
//    private void printItems(Document doc, List<OrderDetail> items) {
//
//        Table table = new Table(new float[]{1, 6, 2, 3});
//        table.setWidth(UnitValue.createPercentValue(100));
//        table.setBorder(Border.NO_BORDER);
//
//        table.addHeaderCell(header("STT"));
//        table.addHeaderCell(header("Món"));
//        table.addHeaderCell(header("SL"));
//        table.addHeaderCell(header("Giá"));
//
//        int stt = 1;
//
//        for (OrderDetail item : items) {
//
//            table.addCell(centerCell(stt++));
//            table.addCell(leftCell(item.getFood()));
//            table.addCell(centerCell(item.getQuantity()));
//            table.addCell(rightCell(format(item.getAmount())));
//
//            // Up size
//            if (item.isUpsizeOption()) {
//                table.addCell(optionCell("+ Up size"));
//            }
//
//            // Topping
//            if (item.getTopping() != null && !item.getTopping().isBlank()) {
//                table.addCell(optionCell("+ Topping:"));
//
//                for (String t : item.getTopping().split(",")) {
//                    table.addCell(subOptionCell("- " + t.trim()));
//                }
//            }
//
//            table.addCell(fullLineCell());
//        }
//
//        doc.add(table);
//    }
//
//    // ================= TOTAL =================
//
//    private void printTotal(Document doc, Bill bill) {
//
//        doc.add(rightBold("Tổng tiền: " + format(bill.getTotalBefore())));
//        doc.add(rightBold("Giảm giá: " + format(bill.getTotalDiscount())));
//
//        doc.add(fullLine());
//
//        doc.add(rightBoldBig("THANH TOÁN: "
//                + format(bill.getTotalAmount())));
//
//        doc.add(fullLine());
//    }
//
//    // ================= FOOTER =================
//
//    private void printFooter(Document doc) {
//
//        doc.add(centerSmall("Cảm ơn quý khách!"));
//    }
//
//    // ================= PARAGRAPH =================
//
//    private Paragraph text(String t) {
//        return new Paragraph(t).setFontSize(9);
//    }
//
//    private Paragraph centerSmall(String t) {
//        return new Paragraph(t)
//                .setFontSize(7)
//                .setTextAlignment(TextAlignment.CENTER);
//    }
//
//    private Paragraph centerBoldBig(String t) {
//        return new Paragraph(t)
//                .setFontSize(11)
//                .setBold()
//                .setTextAlignment(TextAlignment.CENTER);
//    }
//
//    private Paragraph rightBold(String t) {
//        return new Paragraph(t)
//                .setFontSize(9)
//                .setBold()
//                .setTextAlignment(TextAlignment.RIGHT);
//    }
//
//    private Paragraph rightBoldBig(String t) {
//        return new Paragraph(t)
//                .setFontSize(10)
//                .setBold()
//                .setTextAlignment(TextAlignment.RIGHT);
//    }
//
//    private Paragraph fullLine() {
//        return new Paragraph("────────────────────────")
//                .setFontSize(7);
//    }
//
//    // ================= CELL =================
//
//    private Cell header(String t) {
//        return new Cell()
//                .add(new Paragraph(t).setBold().setFontSize(8))
//                .setTextAlignment(TextAlignment.CENTER)
//                .setBorder(Border.NO_BORDER);
//    }
//
//    private Cell leftCell(String t) {
//        return new Cell()
//                .add(new Paragraph(t).setFontSize(8))
//                .setBorder(Border.NO_BORDER);
//    }
//
//    private Cell centerCell(Object v) {
//        return new Cell()
//                .add(new Paragraph(String.valueOf(v)).setFontSize(7))
//                .setTextAlignment(TextAlignment.CENTER)
//                .setBorder(Border.NO_BORDER);
//    }
//
//    private Cell rightCell(String t) {
//        return new Cell()
//                .add(new Paragraph(t).setFontSize(8))
//                .setTextAlignment(TextAlignment.RIGHT)
//                .setBorder(Border.NO_BORDER);
//    }
//
//    private Cell optionCell(String t) {
//        return new Cell(1, 4)
//                .add(new Paragraph("  " + t).setFontSize(7))
//                .setBorder(Border.NO_BORDER);
//    }
//
//    private Cell subOptionCell(String t) {
//        return new Cell(1, 4)
//                .add(new Paragraph("    " + t).setFontSize(7))
//                .setBorder(Border.NO_BORDER);
//    }
//
//    private Cell fullLineCell() {
//        return new Cell(1, 4)
//                .add(new Paragraph("────────────────────────").setFontSize(7))
//                .setBorder(Border.NO_BORDER);
//    }
//
//    // ================= FORMAT =================

    private String formatDate(LocalDateTime t) {
        return t == null ? "" :
                t.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String formatHour(LocalDateTime t) {
        return t == null ? "" :
                t.format(DateTimeFormatter.ofPattern("HH:mm"));
    }

    private String format(double v) {
        return String.format("%,.0f", v);
    }
@Override
public byte[] generatePaymentInvoicePdf(Long billId) {
    Bill bill = billRepository.findByIdWithDetails(billId)
            .orElseThrow(() -> new NotFoundException("BillNotFound", "Không tìm thấy hóa đơn"));

    Order order = bill.getOrder();
    List<OrderDetail> items = orderDetailRepository.findAllByOrderId(order.getId());

    try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
        InputStream fontStream = getClass().getClassLoader().getResourceAsStream("fonts/NotoSans-Regular.ttf");
        if (fontStream == null) throw new RuntimeException("Không tìm thấy font");
        PdfFont font = PdfFontFactory.createFont(fontStream.readAllBytes(), PdfEncodings.IDENTITY_H);

        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document doc = new Document(pdf, new PageSize(164, 2000));
        doc.setMargins(8, 6, 8, 6);
        doc.setFont(font);

        // Body
        printStoreInfo(doc);
        printBillInfo(doc, order);
        printItems(doc, items);
        printTotal(doc, bill);
        printFooter(doc);

        doc.close();
        return baos.toByteArray();
    } catch (Exception e) {
        throw new RuntimeException("Lỗi khi tạo hóa đơn PDF", e);
    }
}

// ================= SECTIONS =================

    private void printStoreInfo(Document doc) {
        doc.add(centerBoldBig("CƠM THỐ BÁCH KHOA"));
        doc.add(centerSmall("C11-02 Geleximco\nĐ. Lê Trọng Tấn, Hà Nội\nHotline: 091 409 8386"));
        doc.add(createSeparator(new DashedLine(1f)));
    }

    private void printBillInfo(Document doc, Order order) {
        doc.add(centerBoldBig("HÓA ĐƠN THANH TOÁN"));
        String deskName = deskRepository.findByIdAndStatus(order.getDesk(), true)
                .map(Desk::getName)
                .orElse("Không rõ bàn");
        doc.add(text("Bàn: " + deskName));
        doc.add(text("Ngày: " + formatDate(order.getStartTime())));
        doc.add(text("Giờ: " + formatHour(order.getStartTime()) + " - " + formatHour(order.getEndTime())));
        doc.add(createSeparator(new DashedLine(1f)));
    }

    private void printItems(Document doc, List<OrderDetail> items) {
        // Định nghĩa bảng 4 cột với tỉ lệ cố định
        Table table = new Table(new float[]{1, 5, 1.5f, 2.5f}).useAllAvailableWidth();
        table.setBorder(Border.NO_BORDER);

        // Header
        table.addHeaderCell(headerCell("STT"));
        table.addHeaderCell(headerCell("Tên món"));
        table.addHeaderCell(headerCell("SL"));
        table.addHeaderCell(headerCell("Giá"));

        for (int i = 0; i < items.size(); i++) {
            OrderDetail item = items.get(i);

            // Cột STT
            table.addCell(itemCell(String.valueOf(i + 1), TextAlignment.CENTER));

            // Cột Tên món (Bao gồm cả Topping/Upsize bên trong cùng 1 Cell)
            Cell nameCell = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.LEFT).setPaddingTop(2);
            Paragraph namePara = new Paragraph(item.getFood()).setFontSize(8).setBold().setMultipliedLeading(0.9f);
            nameCell.add(namePara);

            // Thêm Upsize nếu có
            if (item.isUpsizeOption()) {
                nameCell.add(new Paragraph(" + Up size").setFontSize(7).setItalic().setMultipliedLeading(0.8f));
            }

            // Thêm Topping nếu có
            if (item.getTopping() != null && !item.getTopping().isBlank()) {
                nameCell.add(new Paragraph(" + Topping:").setFontSize(7).setItalic().setMultipliedLeading(0.8f));
                for (String t : item.getTopping().split(",")) {
                    nameCell.add(new Paragraph("  - " + t.trim()).setFontSize(7).setItalic().setMultipliedLeading(0.8f));
                }
            }
            table.addCell(nameCell);

            // Cột Số lượng
            table.addCell(itemCell(String.valueOf(item.getQuantity()), TextAlignment.CENTER));

            // Cột Giá
            table.addCell(itemCell(format(item.getAmount()), TextAlignment.RIGHT));

            // XỬ LÝ DÒNG KẺ: Chỉ thêm nét đứt nếu KHÔNG PHẢI món cuối cùng
            if (i < items.size() - 1) {
                table.addCell(new Cell(1, 4).add(createSeparator(new DashedLine(0.5f))).setBorder(Border.NO_BORDER));
            }
        }
        doc.add(table);
    }

    private void printTotal(Document doc, Bill bill) {
        doc.add(createSeparator(new SolidLine(1f))); // Chốt bảng món ăn

        Table table = new Table(new float[]{7, 3}).useAllAvailableWidth();

        // Tổng tiền
        table.addCell(labelBoldCell("Tổng tiền:"));
        table.addCell(valueCell(format(bill.getTotalBefore())));

        // Giảm giá
        table.addCell(labelBoldCell("Giảm giá:"));
        table.addCell(valueCell(format(bill.getTotalDiscount())));
        doc.add(table);

        doc.add(createSeparator(new DashedLine(1f)));

        // Thành tiền
        Table finalTable = new Table(new float[]{7, 3}).useAllAvailableWidth();
        finalTable.addCell(labelBoldCell("THANH TOÁN:"));
        finalTable.addCell(valueBoldCell(format(bill.getTotalAmount())));
        doc.add(finalTable);

        doc.add(createSeparator(new SolidLine(1f)));
    }

    private void printFooter(Document doc) {
        doc.add(new Paragraph("Cảm ơn quý khách!").setFontSize(8).setItalic().setTextAlignment(TextAlignment.CENTER));
    }

// ================= HELPERS (STYLING) =================

    private LineSeparator createSeparator(ILineDrawer line) {
        LineSeparator ls = new LineSeparator(line);
        ls.setMarginTop(2);
        ls.setMarginBottom(2);
        return ls;
    }

    private Paragraph text(String t) {
        return new Paragraph(t).setFontSize(8).setMultipliedLeading(0.9f).setMarginBottom(1);
    }

    private Paragraph centerSmall(String t) {
        return new Paragraph(t).setFontSize(7).setTextAlignment(TextAlignment.CENTER).setMultipliedLeading(0.9f);
    }

    private Paragraph centerBoldBig(String t) {
        return new Paragraph(t).setFontSize(10).setBold().setTextAlignment(TextAlignment.CENTER).setMarginBottom(2);
    }

    private Cell headerCell(String t) {
        return new Cell().add(new Paragraph(t).setBold().setFontSize(8))
                .setBorder(Border.NO_BORDER).setBorderBottom(new DashedBorder(0.5f)).setTextAlignment(TextAlignment.CENTER);
    }

    private Cell itemCell(String t, TextAlignment align) {
        return new Cell().add(new Paragraph(t).setFontSize(8).setMultipliedLeading(0.9f))
                .setBorder(Border.NO_BORDER).setTextAlignment(align).setPaddingTop(2);
    }

    private Cell optionCell(String t) {
        return new Cell(1, 4).add(new Paragraph("  " + t).setFontSize(7).setItalic().setMultipliedLeading(0.8f)).setBorder(Border.NO_BORDER);
    }

    private Cell subOptionCell(String t) {
        return new Cell(1, 4).add(new Paragraph("    " + t).setFontSize(7).setItalic().setMultipliedLeading(0.8f)).setBorder(Border.NO_BORDER);
    }

    private Cell labelCell(String t) {
        return new Cell().add(new Paragraph(t).setFontSize(8.5f)).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.LEFT);
    }

    private Cell valueCell(String t) {
        return new Cell().add(new Paragraph(t).setFontSize(8.5f)).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
    }

    private Cell labelBoldCell(String t) {
        return new Cell().add(new Paragraph(t).setFontSize(9.5f).setBold()).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.LEFT);
    }

    private Cell valueBoldCell(String t) {
        return new Cell().add(new Paragraph(t).setFontSize(9.5f).setBold()).setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT);
    }


}
