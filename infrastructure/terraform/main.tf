data "azurerm_client_config" "current" {}

# ─── Resource Group ───────────────────────────────────────────────────────────
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# ─── Azure Container Registry (Chứa Docker Image của API) ────────────────────
resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic" # Dùng gói Basic cho rẻ
  admin_enabled       = true    # Bật lên để Container App dễ dàng pull image

  tags = var.tags
}

# ─── Log Analytics Workspace (Bắt buộc phải có cho Container Apps) ───────────
resource "azurerm_log_analytics_workspace" "law" {
  name                = var.law_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = var.tags
}

# ─── 1. FRONTEND: Azure Static Web App ────────────────────────────────────────
resource "azurerm_static_web_app" "frontend" {
  name                = "swa-library-frontend"
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastasia" # SWA chỉ hỗ trợ một số region nhất định
  sku_tier            = "Free"     # Bú gói Free ngon lành
  sku_size            = "Free"

  tags = var.tags
}

# ─── 2. BACKEND: Azure Container Apps Environment ─────────────────────────────
resource "azurerm_container_app_environment" "env" {
  name                       = "cae-library-env"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.law.id

  tags = var.tags
}

# ─── 3. BACKEND: Azure Container App (Chạy Docker Container của API) ────────
resource "azurerm_container_app" "backend" {
  name                         = "ca-library-api"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    container {
      name   = "api-container"
      # Tạm thời dùng image hello-world, GitHub Actions sẽ push image thật đè lên sau
      image  = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" 
      cpu    = 0.25
      memory = "0.5Gi"
    }
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 3000 # Đổi cổng này lại nếu API Node.js của ông chạy cổng khác
    
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  # Cấu hình để Container App có quyền kéo Image từ ACR
  registry {
    server               = azurerm_container_registry.acr.login_server
    username             = azurerm_container_registry.acr.admin_username
    password_secret_name = "acr-password"
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.acr.admin_password
  }

  tags = var.tags
}