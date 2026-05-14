# 🚀 Hướng Dẫn Deploy — Library Management System

> **Stack**: Node.js Express API → Azure Container Registry (ACR) → Azure Container App | React/Vite Frontend → Azure Static Web App  
> **IaC**: Terraform | **CI/CD**: GitHub Actions

---

## 📑 Mục Lục

1. [Yêu cầu chuẩn bị](#1-yêu-cầu-chuẩn-bị)
2. [Bước 1 — Cài đặt công cụ local](#2-bước-1--cài-đặt-công-cụ-local)
3. [Bước 2 — Đăng nhập Azure & tạo Service Principal](#3-bước-2--đăng-nhập-azure--tạo-service-principal)
4. [Bước 3 — Provision hạ tầng bằng Terraform](#4-bước-3--provision-hạ-tầng-bằng-terraform)
5. [Bước 4 — Lấy thông tin sau Terraform apply](#5-bước-4--lấy-thông-tin-sau-terraform-apply)
6. [Bước 5 — Cấu hình GitHub Secrets](#6-bước-5--cấu-hình-github-secrets)
7. [Bước 6 — Thêm Secret vào Azure Container App](#7-bước-6--thêm-secret-vào-azure-container-app)
8. [Bước 7 — Push code lên GitHub để kích hoạt CI/CD](#8-bước-7--push-code-lên-github-để-kích-hoạt-cicd)
9. [Bước 8 — Kiểm tra kết quả](#9-bước-8--kiểm-tra-kết-quả)
10. [Cấu trúc GitHub Secrets (tổng hợp)](#10-cấu-trúc-github-secrets-tổng-hợp)
11. [Troubleshooting thường gặp](#11-troubleshooting-thường-gặp)

---

## 1. Yêu cầu chuẩn bị

| Thứ cần có | Ghi chú |
|---|---|
| Tài khoản Azure (có Subscription) | Dùng Azure for Students nếu có |
| Tài khoản GitHub + repo đã push code | Repo phải là repo của project này |
| Tài khoản Supabase | Đã tạo project và có `URL` + các key |
| Tài khoản Cloudinary | Đã có `cloud_name`, `api_key`, `api_secret` |

---

## 2. Bước 1 — Cài đặt công cụ local

### 2.1 Azure CLI

```bash
# Windows (winget)
winget install Microsoft.AzureCLI

# Kiểm tra
az --version
```

### 2.2 Terraform

```bash
# Windows (winget)
winget install Hashicorp.Terraform

# Kiểm tra
terraform --version
```

### 2.3 Docker Desktop

Tải tại: https://www.docker.com/products/docker-desktop  
Đảm bảo Docker đang chạy trước khi thực hiện các bước tiếp theo.

---

## 3. Bước 2 — Đăng nhập Azure & tạo Service Principal

### 3.1 Đăng nhập Azure CLI

```bash
az login
```

Trình duyệt sẽ mở ra, đăng nhập bằng tài khoản Azure của bạn.

### 3.2 Xem danh sách Subscription và lưu lại `id`

```bash
az account list --output table
```

Ghi lại `SubscriptionId` (dạng UUID) mà bạn muốn dùng.

### 3.3 Set subscription mặc định

```bash
az account set --subscription "<SUBSCRIPTION_ID>"
```

### 3.4 Tạo Service Principal cho GitHub Actions

> Service Principal là "tài khoản robot" để GitHub Actions có quyền deploy lên Azure.

```bash
az ad sp create-for-rbac \
  --name "sp-library-github-actions" \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID> \
  --sdk-auth
```

**Output** sẽ có dạng JSON:

```json
{
  "clientId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "clientSecret": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "tenantId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  ...
}
```

> ⚠️ **Copy TOÀN BỘ JSON này** — đây chính là giá trị của secret `AZURE_CREDENTIALS` ở bước 5.

---

## 4. Bước 3 — Provision hạ tầng bằng Terraform

```bash
# Di chuyển vào thư mục terraform
cd infrastructure/terraform

# Khởi tạo Terraform (tải provider Azure)
terraform init

# Xem trước những gì sẽ được tạo
terraform plan

# Tạo hạ tầng trên Azure (~3-5 phút)
terraform apply -auto-approve
```

Terraform sẽ tạo ra:
- ✅ Resource Group `rg-library-project`
- ✅ Azure Container Registry (ACR) `acrlibraryuit23521361`
- ✅ Log Analytics Workspace `law-library-uit`
- ✅ Container App Environment `cae-library-env`
- ✅ Azure Container App `ca-library-api` (tạm thời chạy image `hello-world`)
- ✅ Azure Static Web App `swa-library-frontend`

---

## 5. Bước 4 — Lấy thông tin sau Terraform apply

Sau khi `terraform apply` hoàn thành, chạy các lệnh sau để lấy thông tin cần thiết:

### 5.1 Lấy thông tin ACR (username + password)

```bash
az acr credential show --name acrlibraryuit23521361
```

Output:
```json
{
  "passwords": [
    { "name": "password",  "value": "<ACR_PASSWORD>" },
    { "name": "password2", "value": "<ACR_PASSWORD_2>" }
  ],
  "username": "acrlibraryuit23521361"
}
```

Lưu lại:
- **ACR_USERNAME**: `acrlibraryuit23521361`
- **ACR_PASSWORD**: giá trị `password` (dùng `password`, không dùng `password2`)

### 5.2 Lấy Deployment Token của Static Web App

```bash
az staticwebapp secrets list \
  --name swa-library-frontend \
  --resource-group rg-library-project \
  --query "properties.apiKey" \
  --output tsv
```

Lưu lại giá trị này → đây là **SWA_DEPLOYMENT_TOKEN**.

### 5.3 Lấy URL của Container App (để dùng làm VITE_API_URL)

```bash
az containerapp show \
  --name ca-library-api \
  --resource-group rg-library-project \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv
```

Output dạng: `ca-library-api.xxxxxxxx.eastasia.azurecontainerapps.io`

URL đầy đủ sẽ là: `https://ca-library-api.xxxxxxxx.eastasia.azurecontainerapps.io`

---

## 6. Bước 5 — Cấu hình GitHub Secrets

Vào GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Thêm lần lượt các secret sau:

### 🔐 Nhóm Azure / Infra

| Secret Name | Giá trị | Lấy từ đâu |
|---|---|---|
| `AZURE_CREDENTIALS` | Toàn bộ JSON từ bước 3.4 | `az ad sp create-for-rbac --sdk-auth` |
| `ACR_USERNAME` | `acrlibraryuit23521361` | Bước 5.1 |
| `ACR_PASSWORD` | Chuỗi password của ACR | Bước 5.1 |
| `SWA_DEPLOYMENT_TOKEN` | Token của Static Web App | Bước 5.2 |

### 🌐 Nhóm Frontend

| Secret Name | Giá trị | Ghi chú |
|---|---|---|
| `VITE_API_URL` | `https://ca-library-api.xxx.eastasia.azurecontainerapps.io` | URL lấy từ bước 5.3 |

### 🗄️ Nhóm API / Backend

| Secret Name | Giá trị | Lấy từ đâu |
|---|---|---|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase Dashboard → Project Settings → API |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự | Tự tạo (xem bên dưới) |
| `JWT_REFRESH_SECRET` | Chuỗi ngẫu nhiên ≥ 48 ký tự | Tự tạo (xem bên dưới) |
| `CLIENT_URL` | URL của Static Web App | Azure Portal → Static Web App → URL |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | `12345...` | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | `abc123...` | Cloudinary Dashboard |

**Tạo JWT Secret ngẫu nhiên (chạy trên terminal):**

```bash
# PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))

# hoặc nếu có OpenSSL
openssl rand -base64 48
```

---

## 7. Bước 6 — Thêm Secret vào Azure Container App

GitHub Actions workflow sẽ inject env vars vào Container App, nhưng các biến dùng `secretref:` yêu cầu secret phải được tạo trước trên Azure Container App. Chạy lệnh sau:

```bash
az containerapp secret set \
  --name ca-library-api \
  --resource-group rg-library-project \
  --secrets \
    supabase-url="<SUPABASE_URL>" \
    supabase-service-role-key="<SUPABASE_SERVICE_ROLE_KEY>" \
    supabase-anon-key="<SUPABASE_ANON_KEY>" \
    jwt-secret="<JWT_SECRET>" \
    jwt-refresh-secret="<JWT_REFRESH_SECRET>" \
    client-url="<CLIENT_URL>" \
    cloudinary-cloud-name="<CLOUDINARY_CLOUD_NAME>" \
    cloudinary-api-key="<CLOUDINARY_API_KEY>" \
    cloudinary-api-secret="<CLOUDINARY_API_SECRET>"
```

> 💡 Thay các placeholder `<...>` bằng giá trị thực. Lệnh này chỉ cần chạy **một lần** — GitHub Actions chỉ cập nhật image, không overwrite secret.

---

## 8. Bước 7 — Push code lên GitHub để kích hoạt CI/CD

Sau khi cấu hình xong tất cả secrets, push code lên nhánh `main`:

```bash
git add .
git commit -m "ci: add GitHub Actions workflows and Dockerfile"
git push origin main
```

GitHub Actions sẽ tự động:
- Detect thay đổi trong `API/` → chạy workflow `deploy-api.yml`
- Detect thay đổi trong `Front_End/` → chạy workflow `deploy-frontend.yml`

**Theo dõi tiến trình** tại: GitHub repo → tab **Actions**

---

## 9. Bước 8 — Kiểm tra kết quả

### 9.1 Kiểm tra API

```bash
# Lấy URL Container App
az containerapp show \
  --name ca-library-api \
  --resource-group rg-library-project \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv

# Gọi thử endpoint health check (nếu có)
curl https://<CONTAINER_APP_FQDN>/api/health
```

### 9.2 Kiểm tra Frontend

```bash
# Lấy URL Static Web App
az staticwebapp show \
  --name swa-library-frontend \
  --resource-group rg-library-project \
  --query "defaultHostname" \
  --output tsv
```

Mở trình duyệt và truy cập URL trên — frontend đã live! 🎉

### 9.3 Kiểm tra image trên ACR

```bash
az acr repository list --name acrlibraryuit23521361 --output table
az acr repository show-tags \
  --name acrlibraryuit23521361 \
  --repository library-api \
  --output table
```

---

## 10. Cấu trúc GitHub Secrets (tổng hợp)

```
GitHub Repository Secrets
├── AZURE_CREDENTIALS          ← JSON từ az ad sp create-for-rbac
├── ACR_USERNAME               ← acrlibraryuit23521361
├── ACR_PASSWORD               ← ACR admin password
├── SWA_DEPLOYMENT_TOKEN       ← Azure Static Web App deploy token
├── VITE_API_URL               ← https://ca-library-api.xxx.azurecontainerapps.io
├── SUPABASE_URL
├── SUPABASE_SERVICE_ROLE_KEY
├── SUPABASE_ANON_KEY
├── JWT_SECRET
├── JWT_REFRESH_SECRET
├── CLIENT_URL                 ← https://xxx.azurestaticapps.net
├── CLOUDINARY_CLOUD_NAME
├── CLOUDINARY_API_KEY
└── CLOUDINARY_API_SECRET
```

---

## 11. Troubleshooting thường gặp

### ❌ Lỗi: `unauthorized: authentication required` khi push lên ACR

**Nguyên nhân**: Secret `ACR_USERNAME` hoặc `ACR_PASSWORD` sai.  
**Giải pháp**: Chạy lại `az acr credential show --name acrlibraryuit23521361` và cập nhật GitHub Secret.

---

### ❌ Lỗi: Container App khởi động nhưng crash ngay lập tức

**Nguyên nhân**: Thiếu biến môi trường (env var).  
**Giải pháp**: Kiểm tra logs trên Azure Portal:
```bash
az containerapp logs show \
  --name ca-library-api \
  --resource-group rg-library-project \
  --follow
```

---

### ❌ Lỗi: `SWA_DEPLOYMENT_TOKEN` không hợp lệ

**Nguyên nhân**: Token đã hết hạn hoặc copy sai.  
**Giải pháp**: Lấy lại token:
```bash
az staticwebapp secrets list \
  --name swa-library-frontend \
  --resource-group rg-library-project \
  --query "properties.apiKey" -o tsv
```

---

### ❌ Frontend bị lỗi CORS khi gọi API

**Nguyên nhân**: `CLIENT_URL` trong Container App secret chưa khớp với domain của Static Web App.  
**Giải pháp**: Cập nhật secret `client-url` trên Container App:
```bash
az containerapp secret set \
  --name ca-library-api \
  --resource-group rg-library-project \
  --secrets client-url="https://<YOUR_SWA_DOMAIN>.azurestaticapps.net"
```
Sau đó restart Container App:
```bash
az containerapp revision restart \
  --name ca-library-api \
  --resource-group rg-library-project \
  --revision $(az containerapp revision list \
    --name ca-library-api \
    --resource-group rg-library-project \
    --query "[0].name" -o tsv)
```

---

### ❌ Workflow không chạy khi push

**Nguyên nhân**: File workflow chưa có trên nhánh `main` hoặc `paths` filter không match.  
**Giải pháp**: Đảm bảo file `.github/workflows/*.yml` đã được commit và push, sau đó chỉnh sửa bất kỳ file nào trong `API/` hoặc `Front_End/` để trigger lại.

---

> 📌 **Lần đầu deploy**: Cả 2 workflow đều không tự chạy nếu chỉ push file workflow. Hãy thay đổi ít nhất 1 file trong `API/` hoặc `Front_End/` cùng lúc để trigger workflow tương ứng.
