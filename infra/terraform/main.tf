terraform {
  required_version = ">= 1.5.0"
}

provider "local" {}

resource "local_file" "sprint2_dummy" {
  filename = "${path.module}/dummy.txt"
  content  = "ProdCty Sprint 2 Terraform Dummy Resource"
}
