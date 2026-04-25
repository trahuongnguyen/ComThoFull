## QZ Tray Silent Printing (POS)

Mục tiêu: chọn máy in 1 lần, các lần sau **silent print** (không hiện popup).

### 1) Cài QZ Tray

- Tải và cài QZ Tray trên máy thu ngân (Windows).
- Mở QZ Tray và đảm bảo biểu tượng đang chạy dưới taskbar.

### 2) Backend (Spring Boot)

Backend đã có endpoint phục vụ QZ:

- **Certificate (public)**: `GET /api/qz/cert`
- **Sign payload**: `POST /api/qz/sign` body `{ "payload": "<string>" }` -> `{ "signature": "<base64>" }`

Lần đầu chạy backend sẽ tự tạo key/cert và lưu tại:

- `%USERPROFILE%\\.restopos\\qz\\private_key_pkcs8.pem`
- `%USERPROFILE%\\.restopos\\qz\\certificate.pem`

Giữ các file này ổn định để tránh QZ hỏi trust lại.

### 3) Frontend (React)

Frontend tự cấu hình QZ security trong `src/App.tsx`:

- `certificateUrl: /api/qz/cert`
- `signUrl: /api/qz/sign`

### 4) Test nhanh

- Mở UI in (`PrintModal`) → phần **Máy in (QZ)**:
  - Bấm **Kết nối**
  - Chọn máy in
  - Bấm **Lưu**
  - Bấm **Test silent**

Sau khi đã lưu máy in, luồng in bếp / in bill tại POS sẽ ưu tiên **silent print** qua QZ.

### 5) Fallback

Nếu máy không có QZ Tray hoặc chưa cấu hình máy in, hệ thống sẽ fallback sang in web (`window.print()`).

