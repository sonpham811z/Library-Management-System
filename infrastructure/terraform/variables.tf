variable "resource_group_name" {
  type        = string
  default     = "rg-library-project"
}

variable "location" {
  type        = string
  default     = "eastasia"
}

variable "tags" {
  type        = map(string)
  default = {
    Environment = "Dev"
    Project     = "NM_CNPM"
  }
}

variable "acr_name" {
  type        = string
  default     = "acrlibraryuit23521361" 
}

variable "law_name" {
  type        = string
  default     = "law-library-uit"
}