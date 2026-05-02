const express = require("express");
const {
  fetchCategoriesByParent,
  addNewCategory,
  updateCategory,
  deleteCategory,
  fetchAllCategories,
  fetchLeafCategories,
  fetchLeafCategoriesWithPath
} = require("../controllers/categoryController");
const {
  categorizeProducts
} = require("../controllers/productCategoryController");

const {
  validateToken,
  validateAdminToken
} = require("../middleware/validateTokenHandler");

const router = express.Router();

router.get(`/fetch/by-parent/:parent_id?`, validateAdminToken, fetchCategoriesByParent);
router.get('/fetch/all', fetchAllCategories);
router.post(`/add`, validateAdminToken, addNewCategory);
router.patch(`/update`, validateAdminToken, updateCategory);
router.delete('/delete/:category_id', validateAdminToken, deleteCategory);
router.post('/categorize', validateAdminToken, categorizeProducts);
router.get('/fetch/all/leaf', fetchLeafCategories);
router.get('/fetch/all/leaf-paths', fetchLeafCategoriesWithPath);

module.exports = router;