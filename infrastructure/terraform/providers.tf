terraform {
  required_version = ">= 1.3.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

# Provider AzureRM — features {} là bắt buộc dù để trống
provider "azurerm" {
  features {}
}
