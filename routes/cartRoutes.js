const express = require("express");
const {
  updateItem,
  removeItem,
  clearCart,
  getCart
} = require("../controllers/cartController");
const {
  validateToken
} = require("../middleware/validateTokenHandler");

const router = express.Router();

router.get("/fetch", validateToken, getCart);
router.put("/item/update", validateToken, updateItem);
router.delete("/item/remove/:product_id", validateToken, removeItem);
router.delete("/remove", validateToken, clearCart);

module.exports = router;