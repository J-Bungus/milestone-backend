const asyncHandler = require("express-async-handler");
const ProductCategoryModel = new (require("../models/productCategoryModel"))();
const ProductModel = new (require("../models/productModel"))();

const categorizeProducts = asyncHandler(async (req, res) => {
  const { product_ids, category_id } = req.body;

  try {
    // 1. Get the list of products currently assigned to this category in the database
    const existingProducts = await ProductModel.getAllProductsOnlyMSAIDByCategory(category_id);
    const existingIds = existingProducts.map(p => p.id);

    // 2. Figure out which ones need to be REMOVED (they are in the DB, but not in the new frontend array)
    const idsToRemove = existingIds.filter(id => !product_ids.includes(id));
    
    for (const id of idsToRemove) {
      await ProductCategoryModel.removeCategory(id, category_id);
    }

    // 3. Figure out which ones need to be ADDED (they are in the new frontend array, but not in the DB)
    const idsToAdd = product_ids.filter(id => !existingIds.includes(id));
    
    for (const id of idsToAdd) {
      await ProductCategoryModel.assignCategory(id, category_id);
    }

    res.status(200).end();
    
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500);
    throw new Error("An error occurred while syncing product categories");
  }
});

module.exports = { categorizeProducts };