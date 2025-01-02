const express = require("express");
const {
  fetchAllProducts,
  fetchProductsBySearchTerm,
  addNewProduct,
  fetchProductByMSAID,
  fetchAllProductOnlyMSAID,
  fetchProductsByCategoryOnlyMSAID,
  fetchProductsByCategory
} = require("../controllers/productController");
const {
  validateToken,
  validateAdminToken
} = require("../middleware/validateTokenHandler");

const router = express.Router();

router.get("/all", validateToken, fetchAllProducts);
router.get("/search", validateToken, fetchProductsBySearchTerm);
router.post("/create", validateAdminToken, upload.array("images"), addNewProduct);
router.get("/specific/:msa_id", validateToken, fetchProductByMSAID);
router.get("/all-msa_id", validateAdminToken, fetchAllProductOnlyMSAID);
router.get("/all/category/:category_id", validateToken, fetchProductsByCategoryOnlyMSAID);
router.get("/search-category", validateToken, fetchProductsByCategory);

module.exports = router;