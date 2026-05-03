const express = require("express");
const {
  fetchAllProducts,
  fetchProductsBySearchTerm,
  addNewProduct,
  fetchProductByMSAID,
  fetchAllProductOnlyMSAID,
  fetchProductsByCategoryOnlyMSAID,
  fetchProductsByCategory,
  searchCategoryProducts,
  updateExistingProduct,
  deleteProduct
} = require("../controllers/productController");
const {
  validateToken,
  validateAdminToken
} = require("../middleware/validateTokenHandler");

const router = express.Router();

router.get("/all", fetchAllProducts);
router.get("/search", fetchProductsBySearchTerm);
router.post("/create", validateAdminToken, upload.array("images"), addNewProduct);
router.patch("/update/:msa_id", validateAdminToken, upload.array("images"), updateExistingProduct);
router.delete("/delete/:msa_id", validateAdminToken, deleteProduct);
router.get("/specific/:msa_id", fetchProductByMSAID);
router.get("/all-msa_id", validateAdminToken, fetchAllProductOnlyMSAID);
router.get("/all/category/:category_id", fetchProductsByCategoryOnlyMSAID);
router.get("/search-category", fetchProductsByCategory);
router.get("/search-in-category", searchCategoryProducts);

module.exports = router;