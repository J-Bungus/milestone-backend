const asyncHandler = require("express-async-handler");
const ProductCategoryModel = new (require("../models/productCategoryModel"))();
const ProductModel = new (require("../models/productModel"))();
const categorizeProducts = asyncHandler(async (req, res) => {
  const { product_ids, category_id } = req.body;

  if (product_ids.length === 0) {
    const products = await ProductModel.getAllProductsOnlyMSAIDByCategory(category_id);
    products.forEach(async product => {
      try {
        await ProductCategoryModel.removeCategory(product.id, category_id);
      } catch (error) {
        console.error(error);
        res.status(500);
        throw new Error("An error occurred while removing categorization");
      }
    });

    res.status(200).end();
    return;
  }

  product_ids.forEach(async (product_id) => {
    try{
      const productCategory = await ProductCategoryModel.getProductCategories(product_id, category_id);

      if (!productCategory) {
        await ProductCategoryModel.assignCategory(product_id, category_id);
      }

    } catch (error){
      console.error(error);
      res.status(500);
      throw new Error("An error occurred while categorizing products");
    }
  });
  
  res.status(200).end();
});

module.exports = { categorizeProducts };