const express = require("express");
const router = express.Router();
const c = require("../controllers/phieunhap.controller");

router.get("/", c.getAll);
router.get("/:id", c.getById);
router.post("/", c.create);
router.put("/:id/details", c.saveDetails); // Thêm tuyến đường lưu chi tiết

module.exports = router;
