const express = require("express");
const {
  fetchInvoice,
  generateInvoice,
  sendInvoice
} = require("../controllers/invoiceController");

const {
  validateToken
} = require("../middleware/validateTokenHandler");

const router = express.Router();

router.get("/fetch/:id?", validateToken, fetchInvoice);
router.post("/generate", validateToken, generateInvoice);
router.post("/send", validateToken, sendInvoice);

module.exports = router;