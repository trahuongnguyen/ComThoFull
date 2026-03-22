# ComTho — Hệ thống quản lý nhà hàng

Monorepo gồm:
- **`ComTho/`** — Backend Spring Boot (REST API + MySQL)
- **`com-tho-50736d72/`** — Frontend React + Vite (giao diện POS)
- **`deploy/`** — Gói thành phẩm giao cho khách hàng

Toàn bộ hệ thống chạy qua **Docker Compose**, không cần cài Java, Node.js hay MySQL trên máy.

---

## Yêu cầu môi trường (máy dev)

| Phần mềm | Phiên bản tối thiểu | Link tải |
|---|---|---|
| Docker Desktop | 4.x trở lên | https://www.docker.com/products/docker-desktop |
| Git | bất kỳ | https://git-scm.com |
| PowerShell | 5.1+ (có sẵn trên Windows 10/11) | — |

---

## Cài đặt lần đầu (sau khi clone)

### 1. Tạo file `.env` từ mẫu

```powershell
Copy-Item .env.example .env
```

File `.env` dùng cho `docker-compose.yml` ở thư mục gốc (môi trường dev/build). Nội dung mặc định trong `.env.example` có thể dùng thẳng để chạy local.

### 2. Tạo file `deploy\.env` từ mẫu

```powershell
Copy-Item deploy\.env.example deploy\.env
```

File `deploy\.env` được đóng gói vào ZIP giao cho khách. Dùng cùng giá trị với `.env` ở trên (hoặc đặt mật khẩu riêng cho từng khách nếu cần).

> **Lưu ý:** Cả hai file `.env` đều bị gitignore — không bao giờ commit credentials thật lên repo.

---

## Chạy local để phát triển / kiểm thử

```powershell
docker compose up --build
```

- Lần đầu build mất khoảng **5–15 phút** (tải dependencies).
- Từ lần sau chỉ mất **30–60 giây**.
- Truy cập tại: **http://localhost**

| Tài khoản | Username | Password |
|---|---|---|
| Quản trị viên | `systemAdmin` | `systemAdmin` |
| Nhân viên | `employee` | `employee` |

Tắt hệ thống:

```powershell
docker compose down
```

---

## Đóng gói và giao cho khách hàng

### Bước 1 — Chạy script đóng gói

```powershell
.\package-for-delivery.ps1
```

Script tự động thực hiện toàn bộ quy trình:

1. Kiểm tra `.env` và `deploy\.env` tồn tại
2. Build Docker images (`comtho-backend`, `comtho-frontend`)
3. Xuất images ra `deploy\images.tar`
4. Nén toàn bộ thư mục `deploy\` thành file ZIP có tên dạng `RestoPOS-v20260322.zip`

> Nếu muốn gắn số phiên bản cụ thể:
> ```powershell
> .\package-for-delivery.ps1 -Version "1.0.0"
> ```

### Bước 2 — Gửi file ZIP cho khách

Gửi file `RestoPOS-vXXXXXXXX.zip` cho khách qua Zalo, email, USB, v.v.

---

## Hướng dẫn cho khách hàng

> Đây là nội dung bạn giải thích hoặc gửi kèm cho khách. Khách **không cần biết gì về công nghệ**, chỉ cần làm đúng 2 bước sau.

### Yêu cầu máy khách

- Windows 10 hoặc Windows 11 (64-bit)
- RAM tối thiểu: 4 GB
- Dung lượng trống: 3 GB
- **Docker Desktop** — tải và cài một lần duy nhất tại:
  **https://www.docker.com/products/docker-desktop**

### Cài Docker Desktop (chỉ làm 1 lần)

1. Vào link trên, bấm **"Download for Windows"**
2. Chạy file `.exe` vừa tải, bấm Next → Next → Install
3. Khởi động lại máy tính
4. Mở **Docker Desktop** từ Start Menu, chờ đến khi thấy thông báo **"Docker Desktop is running"** ở góc dưới phải màn hình

### Chạy ứng dụng

1. Giải nén file ZIP vào **bất kỳ thư mục nào** (ví dụ `C:\RestoPOS\`)
2. **Double-click vào `start.bat`**
3. Chờ khoảng **3–5 phút** lần đầu (các lần sau chỉ 30–60 giây)
4. Trình duyệt tự động mở tại **http://localhost**

| Tài khoản | Username | Password |
|---|---|---|
| Quản trị viên | `systemAdmin` | `systemAdmin` |
| Nhân viên | `employee` | `employee` |

### Tắt ứng dụng

Double-click vào **`stop.bat`**

### Lưu ý quan trọng cho khách

- Dữ liệu lưu trên máy tính của khách — **không mất khi tắt ứng dụng**
- **Không xóa** thư mục `RestoPOS` — xóa sẽ mất toàn bộ dữ liệu
- Nếu gặp sự cố, liên hệ kỹ thuật viên hỗ trợ

---

## Cấu trúc repo

```
ComThoFull/
├── ComTho/                      # Backend Spring Boot
│   ├── src/                     # Source code Java
│   ├── Dockerfile
│   └── pom.xml
├── com-tho-50736d72/            # Frontend React + Vite
│   ├── src/                     # Source code TypeScript
│   ├── Dockerfile
│   └── package.json
├── deploy/                      # Gói giao khách (gitignored: .env, images.tar)
│   ├── docker-compose.yml       # Docker Compose dùng cho máy khách
│   ├── start.bat                # Khách double-click để chạy
│   ├── stop.bat                 # Khách double-click để tắt
│   ├── .env.example             # Mẫu credentials cho deploy
│   └── README.txt               # Hướng dẫn dành cho khách (in kèm nếu cần)
├── .env.example                 # Mẫu credentials cho dev
├── docker-compose.yml           # Docker Compose dùng khi dev/build
└── package-for-delivery.ps1    # Script build + đóng gói ZIP
```
