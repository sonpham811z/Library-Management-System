[![UIT Logo](https://i.imgur.com/WmMnSRt.png)](https://www.uit.edu.vn/ "Trường Đại học Công nghệ Thông tin")

# **Nhập môn Công nghệ Phần mềm**

## Hệ thống Quản lý Thư viện — Library Heaven

[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Build-Vite%208-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Style-TailwindCSS-38B2AC?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express%205-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20(PostgreSQL)-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Cloudinary](https://img.shields.io/badge/Storage-Cloudinary-3448C5?style=flat-square&logo=cloudinary)](https://cloudinary.com/)
[![LangChain](https://img.shields.io/badge/AI-LangChain%20%2B%20Gemini-FF6B35?style=flat-square&logo=google)](https://langchain.com/)
[![Azure](https://img.shields.io/badge/Platform-Microsoft%20Azure-0078D4?style=flat-square&logo=microsoftazure)](https://azure.microsoft.com/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?style=flat-square&logo=terraform)](https://terraform.io/)

---

## Thông tin đồ án

| Mục | Nội dung |
| --- | --- |
| **Tên đồ án** | Hệ thống Quản lý Thư viện — Library Heaven |
| **Môn học** | Quản lý dự án Công nghệ Thông tin |
| **Trường** | Đại học Công nghệ Thông tin – ĐHQG TP.HCM |
| **Tên miền** | [library-heaven.online](https://library-heaven.online) *(đã triển khai, tạm tắt)* |
| **Năm học** | 2025 – 2026 |

---

## Thành viên thực hiện

| Họ và tên | MSSV |
| --- | --- |
| Phạm Thái Sơn | 23521361 |
| Lê Gia Quyền | 23521323 |
| Võ Ngọc Tài | 23521620 |

---

## Mục tiêu đồ án

Đồ án xây dựng hệ thống **Quản lý Thư viện** hoàn chỉnh theo mô hình **Fullstack**, triển khai trên nền tảng **Microsoft Azure**, với các mục tiêu chính:

- Xây dựng REST API chuẩn bằng **Node.js + Express 5**, kết nối cơ sở dữ liệu **PostgreSQL** qua **Supabase**
- Phát triển giao diện người dùng hiện đại với **React 19 + Vite + TailwindCSS + shadcn/ui**
- Phân quyền 3 vai trò: **Admin**, **Nhân viên (Staff)**, **Độc giả (Reader)**
- Tích hợp **AI Chatbot** thông minh (LangChain + Google Gemini + Groq) hỗ trợ tra cứu sách và nghiệp vụ thư viện
- Upload ảnh bìa sách lên **Cloudinary**
- Xuất báo cáo dạng **Excel (.xlsx)**
- Triển khai tự động với **GitHub Actions CI/CD** lên Azure (App Service + Static Web Apps)
- Quản lý hạ tầng theo mô hình **Infrastructure as Code** với **Terraform**
- Bảo mật API với **JWT**, **bcrypt**, **Helmet**, **Rate Limiting**

---

## Công nghệ sử dụng

### Backend — `API/`

| Công nghệ | Phiên bản | Vai trò |
| --- | --- | --- |
| Node.js + Express | `^5.2.1` | Web framework |
| Supabase JS | `^2.100.0` | Kết nối PostgreSQL (Supabase) |
| LangChain | `^1.4.0` | AI Agent framework |
| `@langchain/google-genai` | `^2.1.30` | Google Gemini LLM |
| `@langchain/groq` | `^1.2.0` | Groq LLM |
| jsonwebtoken | `^9.0.3` | Xác thực JWT |
| bcryptjs | `^3.0.3` | Hash mật khẩu |
| Cloudinary | `^1.41.3` | Upload & lưu trữ ảnh bìa sách |
| multer + multer-storage-cloudinary | `^2.1.1` | Xử lý upload file |
| xlsx | `^0.18.5` | Xuất báo cáo Excel |
| express-rate-limit | `^8.3.1` | Giới hạn request (Rate Limiting) |
| helmet | `^8.1.0` | Bảo mật HTTP headers |
| morgan | `^1.10.1` | HTTP request logger |

### Frontend — `Front_End/`

| Công nghệ | Phiên bản | Vai trò |
| --- | --- | --- |
| React | `^19.2.4` | UI framework |
| Vite | `^8.0.1` | Build tool |
| TailwindCSS | `^3.4.17` | Utility-first CSS |
| shadcn/ui | — | Component library (Radix UI) |
| Redux Toolkit | `^2.11.2` | State management |
| React Router DOM | `^7.13.2` | Client-side routing |
| Axios | `^1.13.6` | HTTP client |
| Recharts | `^3.8.0` | Biểu đồ thống kê Dashboard |
| react-markdown | `^10.1.0` | Render markdown (AI chat) |
| react-hot-toast | `^2.6.0` | Thông báo toast |

### Infrastructure

| Công nghệ | Vai trò |
| --- | --- |
| Azure App Service | Hosting Backend API (Docker container) |
| Azure Static Web Apps | Hosting Frontend React |
| GitHub Actions | CI/CD tự động (deploy API + Frontend) |
| Terraform | Infrastructure as Code toàn bộ Azure resources |
| Docker | Containerize Backend API |
| Supabase | PostgreSQL managed database |

---

## Kiến trúc hệ thống

```
Developer
    └─► git push → GitHub (main branch)
            ├─► GitHub Actions: deploy-api.yml
            │       └─► Docker build → Azure App Service  (Backend API)
            └─► GitHub Actions: deploy-frontend.yml
                    └─► Vite build  → Azure Static Web Apps (Frontend)

User / Browser
    └─► https://library-heaven.online       (React SPA — Azure Static Web Apps)
            └─► Axios → Backend API         (Express 5 — Azure App Service)
                    ├─► Supabase (PostgreSQL)
                    ├─► Cloudinary (ảnh bìa sách)
                    └─► LangChain AI Agent (Gemini / Groq)
```

---

## Phân quyền hệ thống

| Vai trò | Quyền truy cập |
| --- | --- |
| **Admin** | Toàn quyền: quản lý người dùng, nhóm quyền, tham số hệ thống, báo cáo tổng hợp, xuất Excel |
| **Staff (Nhân viên)** | Quản lý sách, mượn/trả, đặt trước, phiếu thu, phiếu phạt, báo cáo nghiệp vụ |
| **Reader (Độc giả)** | Tìm kiếm sách, xem lịch sử mượn/trả, đặt trước, xem phiếu phạt, hồ sơ cá nhân |

---

## Chức năng chi tiết

### 📚 Quản lý Sách & Tựa sách

- CRUD **Tựa sách** (`tuasach`): tên, tác giả, thể loại, năm xuất bản, mô tả, ảnh bìa
- CRUD **Sách** (`sach`): quản lý từng bản sách vật lý (mã sách, trạng thái có sẵn / đang mượn)
- CRUD **Tác giả** (`tacgia`): thông tin tác giả, liên kết nhiều tựa sách
- CRUD **Thể loại** (`theloai`): phân loại sách
- Upload **ảnh bìa sách** lên Cloudinary
- Tìm kiếm sách theo từ khoá (Reader)

---

### 👤 Quản lý Độc giả & Thẻ độc giả

- CRUD **Độc giả** (`docgia`): thông tin cá nhân, loại độc giả
- CRUD **Loại độc giả** (`loaidocgia`): phân loại (sinh viên, giảng viên, khách...)
- Cấp / gia hạn **Thẻ độc giả** (`readerCard`)
- Quản lý trạng thái thẻ (còn hạn / hết hạn / bị khoá)

---

### 📋 Quản lý Mượn / Trả sách

- Tạo **Phiếu mượn** (`phieumuon`): mượn nhiều sách trong một phiếu
- Tạo **Phiếu trả** (`phieutra`): trả sách, kiểm tra ngày trả
- Tự động tính **tiền phạt** khi trả trễ theo tham số hệ thống
- Xem lịch sử mượn/trả của từng độc giả (Reader: `MyBorrowsPage`)

---

### 📅 Đặt trước sách

- Độc giả **đặt trước** (`datcho / reservation`) sách đang được mượn
- Nhân viên xác nhận / huỷ đặt trước
- Quản lý hàng đợi đặt trước theo từng tựa sách

---

### 💰 Quản lý Phiếu thu & Tiền phạt

- **Phiếu thu** (`phieuthu`): thu phí làm thẻ, gia hạn thẻ
- **Phiếu thu tiền phạt** (`phieuthutienphat`): thu tiền phạt trả trễ
- **Quản lý tiền phạt** (`fine`): theo dõi các khoản phạt chưa / đã thanh toán
- Reader xem lịch sử phạt cá nhân (`MyFinesPage`)

---

### ⚙️ Quản lý Người dùng & Phân quyền

- CRUD **Người dùng** (`nguoidung`): tài khoản đăng nhập hệ thống
- CRUD **Nhóm người dùng** (`nhomnguoidung`): nhóm quyền (Admin, Staff, Reader)
- Phân quyền chi tiết theo **chức năng** (`chucnang`, `phanquyen`)
- Đổi mật khẩu, cập nhật hồ sơ cá nhân (`MyProfilePage`)

---

### 📊 Báo cáo & Thống kê

- **Báo cáo sách trả trễ** (`bcsachtratre`): danh sách sách chưa trả quá hạn
- **Báo cáo tình hình mượn sách** (`bctinhhinhmuonsach`): thống kê theo kỳ, theo thể loại
- **Dashboard Admin**: tổng quan hệ thống với biểu đồ Recharts
- **Dashboard Staff**: thống kê mượn/trả trong ngày
- Xuất báo cáo dạng **file Excel (.xlsx)**

---

### 🔧 Tham số & Chính sách hệ thống

- Cấu hình **tham số** (`thamso`): số ngày mượn tối đa, mức phạt/ngày, số sách mượn tối đa
- Quản lý **chính sách** (`policy`): quy định thư viện hiển thị cho người dùng
- Admin chỉnh sửa linh hoạt không cần deploy lại

---

### 🤖 AI Chatbot — `ai.agent.js` + `ai.tools.js`

Tích hợp **LangChain Agent** với **Google Gemini** và **Groq** hỗ trợ:

- Tra cứu thông tin sách, tác giả, thể loại bằng ngôn ngữ tự nhiên
- Hỏi đáp về quy định, chính sách thư viện
- Kiểm tra trạng thái sách, số lượng còn lại
- Gợi ý sách theo chủ đề
- Giao diện **chat widget** tích hợp trong Frontend (`AiChatWidget.jsx`)

---

## Cấu trúc thư mục

```
lib/
├── API/                                # Backend Node.js + Express
│   └── src/
│       ├── config/
│       │   ├── supabase.js             # Kết nối Supabase/PostgreSQL
│       │   ├── cloudinary.js           # Cấu hình Cloudinary
│       │   ├── constants.js            # Hằng số hệ thống
│       │   └── schema.sql              # Schema database
│       ├── controllers/                # 21 controllers (request handler)
│       ├── services/                   # Business logic
│       │   ├── ai.agent.js             # LangChain AI Agent
│       │   ├── ai.tools.js             # AI tools (tra cứu DB)
│       │   ├── book.service.js
│       │   ├── borrow.service.js
│       │   ├── fine.service.js
│       │   ├── readerCard.service.js
│       │   ├── report.service.js
│       │   ├── reservation.service.js
│       │   └── user.service.js
│       ├── models/                     # 22 models (Supabase queries)
│       ├── routes/                     # 21 route modules
│       ├── middlewares/
│       │   ├── auth.middleware.js      # Xác thực JWT + phân quyền
│       │   ├── upload.middleware.js    # Multer + Cloudinary
│       │   └── error.middleware.js     # Xử lý lỗi tập trung
│       └── utils/
│           ├── jwt.js                  # Tạo / verify JWT
│           ├── tokenBucket.js          # Rate limiting
│           └── response.js             # Chuẩn hoá response
│   ├── app.js
│   ├── Dockerfile
│   └── package.json
│
├── Front_End/                          # Frontend React + Vite
│   └── src/
│       ├── pages/
│       │   ├── admin/                  # Dashboard, Books, Borrows, Fines, Reports...
│       │   ├── staff/                  # Staff Dashboard, Borrows, Fines, Reports...
│       │   └── reader/                 # My Borrows, Fines, Reservations, Search...
│       ├── features/                   # Redux slices
│       ├── components/
│       │   ├── ai/                     # AiChatWidget
│       │   ├── layout/                 # Header, Sidebar, MainLayout
│       │   └── ui/                     # shadcn/ui components (40+ components)
│       └── api/                        # 25 Axios API modules
│   └── package.json
│
├── infrastructure/
│   └── terraform/
│       ├── main.tf                     # Azure resources definition
│       ├── variables.tf
│       └── providers.tf
│
├── .github/
│   └── workflows/
│       ├── deploy-api.yml              # CI/CD: Docker → Azure App Service
│       └── deploy-frontend.yml         # CI/CD: Vite build → Azure Static Web Apps
│
├── schema.sql                          # Database schema PostgreSQL
└── DEPLOYMENT.md                       # Hướng dẫn triển khai Azure
```

---

## Hướng dẫn cài đặt & chạy local

### Yêu cầu

```
Node.js  >= 18.x
npm      >= 9.x
Tài khoản Supabase (PostgreSQL)
Tài khoản Cloudinary
Google Gemini API Key hoặc Groq API Key
```

### 1. Clone repository

```bash
git clone https://github.com/sonpham811z/Library-Management-System.git
cd Library-Management-System
```

### 2. Cài đặt & chạy Backend

```bash
cd API
npm install
cp .env.example .env
```

Chỉnh sửa `API/.env`:

```env
PORT=5000

# Supabase
SUPABASE_URL=''
SUPABASE_KEY=''

# JWT
JWT_SECRET=''
JWT_EXPIRES_IN='7d'

# Cloudinary
CLOUDINARY_CLOUD_NAME=''
CLOUDINARY_API_KEY=''
CLOUDINARY_API_SECRET=''

# AI
GOOGLE_API_KEY=''
GROQ_API_KEY=''
```

```bash
npm run dev
# API chạy tại: http://localhost:5000
```

### 3. Cài đặt & chạy Frontend

```bash
cd Front_End
npm install
cp .env.example .env
```

Chỉnh sửa `Front_End/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
# Frontend chạy tại: http://localhost:5173
```

---

## CI/CD & Triển khai Azure

Dự án áp dụng **GitHub Actions** để tự động triển khai lên Azure khi push lên nhánh `main`:

| Workflow | Trigger | Target |
| --- | --- | --- |
| `deploy-api.yml` | Push vào `API/**` | Azure App Service (Docker container) |
| `deploy-frontend.yml` | Push vào `Front_End/**` | Azure Static Web Apps |

### Hạ tầng (Terraform)

Toàn bộ Azure resources được định nghĩa trong `infrastructure/terraform/`:

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

---

## API Endpoints tổng quan

| Nhóm | Prefix | Mô tả |
| --- | --- | --- |
| Auth | `/api/auth` | Đăng nhập, đăng xuất, refresh token |
| Sách & Tựa sách | `/api/sach`, `/api/tuasach` | CRUD sách và tựa sách |
| Tác giả / Thể loại | `/api/tacgia`, `/api/theloai` | CRUD tác giả, thể loại |
| Độc giả | `/api/docgia`, `/api/loaidocgia` | CRUD độc giả, loại độc giả |
| Mượn / Trả | `/api/phieumuon`, `/api/phieutra` | Phiếu mượn, phiếu trả |
| Đặt trước | `/api/datcho`, `/api/reservation` | Đặt trước sách |
| Phiếu thu | `/api/phieuthu`, `/api/phieuthutienphat` | Thu phí, thu phạt |
| Tiền phạt | `/api/fine` | Quản lý khoản phạt |
| Người dùng | `/api/nguoidung`, `/api/nhomnguoidung` | Tài khoản, nhóm quyền |
| Báo cáo | `/api/baocao`, `/api/report` | Báo cáo thống kê, xuất Excel |
| Tham số | `/api/thamso`, `/api/policy` | Cấu hình hệ thống |
| AI | `/api/ai` | Chat AI (LangChain Agent) |

---

## Hướng phát triển

- [ ] Tích hợp **thông báo email** khi sách đặt trước có sẵn
- [ ] Thêm **thanh toán online** cho phiếu phạt
- [ ] Tích hợp **barcode / QR code** cho sách và thẻ độc giả
- [ ] Nâng cấp AI Agent với **RAG** (Retrieval-Augmented Generation)
- [ ] Thêm **ứng dụng mobile** (React Native)

---

## Liên hệ

Mọi thắc mắc vui lòng liên hệ nhóm thực hiện qua Issues của repository.

---

**© 2025–2026 – UIT · Quản lý dự án CNTT · ĐHQG TP.HCM**
