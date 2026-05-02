const asyncHandler = require("express-async-handler");
const ProductModel = new (require ("../models/productModel"))();
const ProductCategoryModel = new (require ("../models/productCategoryModel"))();

const fetchAllProducts = asyncHandler(async (req, res) => {
  const { page, itemsPerPage } = req.query;

  let products = [];
  let count = 0;
  try {
    products = await ProductModel.getAlrlWithImages(page, itemsPerPage);
    count = await ProductModel.countAllProducts();
  } catch (error) {
    console.log(error);
  }

  console.log(products);
  
  res.status(200).json({ products, totalProducts: count });
});

const fetchProductsBySearchTerm = asyncHandler(async (req, res) => {
  const { page, itemsPerPage, searchTerm } = req.query;

  let products;
  let count;
  try {
    products = await ProductModel.getBySearchTerm(page, itemsPerPage, searchTerm);
    count = await ProductModel.countBySearchTerm(searchTerm);
  } catch (error) {
    console.log(error);
  }

  res.status(200).json({ products, totalProducts: count });
});

const addNewProduct = asyncHandler(async (req, res) => {
  const product = JSON.parse(req.body.product);

  product.unit_type = product.unit_type || "pcs";
  product.unit_price = product.unit_price || 0;

  const existingProduct = await ProductModel.getProductByMSAID(product.msa_id);
  if (existingProduct) {
    res.status(500);
    throw new Error("This product already exists");
  }

  try {
    delete product.images;
    const newProduct = await ProductModel.createProduct(product);

    const fileUrls = [];
    for (const file of req.files) {
      const filePath = file.originalname.split("/");
      const filename = filePath[filePath.length - 1];
      const blob = bucket.file(`${newProduct.msa_id}-${filename}`);
      const blobStream = blob.createWriteStream({
        resumable: false,
        contentType: file.mimetype
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', async () => {
          fileUrls.push(blob.name);
          resolve();
        });

        blobStream.end(file.buffer);
      });
    }

    fileUrls.map(async file => {
      const imgSrc = await ProductModel.uploadImage(file, newProduct.id);
      console.log(imgSrc);
    });

    for (const category_id of product.categories) {
      await ProductCategoryModel.assignCategory(newProduct.id, category_id);
    }

    res.status(200).json({ product: {
      ...newProduct,
      images: fileUrls
    }});

  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while adding a new product");
  }
});

const fetchProductByMSAID = asyncHandler(async (req, res) => {
  const { msa_id } = req.params;

  try {
    const product = await ProductModel.getProductByMSAID(msa_id);
    console.log(product);
    res.status(200).json({ fetchedProduct: product });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while fetching product");
  }
});

const fetchAllProductOnlyMSAID = asyncHandler(async (req, res) => {
  try {
    const products = await ProductModel.getAllOnlyMSAID();
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occured while fetching products");
  }
});

const fetchProductsByCategoryOnlyMSAID = asyncHandler(async (req, res) => {
  const { category_id } = req.params;
  try {
    const products = await ProductModel.getAllProductsOnlyMSAIDByCategory(category_id);
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while fetching products");
  }
});

// const fetchProductsByCategory = asyncHandler(async (req, res) => {
//   const { category_id, page, itemsPerPage } = req.query;
//   try {
//     const products = await ProductModel.getProductByCategory(category_id, page, itemsPerPage);
//     const count = await ProductModel.countProductByCategory(category_id);
//     res.status(200).json({ products, totalProducts: count});
//   } catch (error) {
//     console.error(error);
//     res.status(500);
//     throw new Error("An error occurred while fetching products");
//   }
// });

// Find your existing controller that fetches products by category
const fetchProductsByCategory = asyncHandler(async (req, res) => {
  const category_id = req.query.category_id || req.params.category_id;
  if (!category_id) {
    res.status(400);
    throw new Error("Category ID is required");
  }

  try {
    // Swap out your old model call for the new recursive one
    const products = await ProductModel.getProductsByCategoryAndDescendants(category_id);
    
    res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while fetching category products");
  }
});

const searchCategoryProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 0;
  const itemsPerPage = parseInt(req.query.itemsPerPage) || 40;
  const categoryId = req.query.category_id;
  
  // 1. Catch the new searchTerm from the frontend (default to empty string)
  const searchTerm = req.query.searchTerm || ""; 

  if (!categoryId) {
    res.status(400);
    throw new Error("Category ID is required");
  }

  try {
    // 2. Pass the searchTerm to the model
    const products = await ProductModel.getProductsByCategoryAndDescendants(
      categoryId, 
      page, 
      itemsPerPage, 
      searchTerm 
    );
    
    // 3. Pass the searchTerm to the total count so pagination updates accurately!
    const totalProducts = await ProductModel.countProductsByCategoryAndDescendants(
      categoryId,
      searchTerm
    );

    res.status(200).json({ products, totalProducts });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while fetching category products");
  }
});

module.exports = { fetchAllProducts, fetchProductsBySearchTerm, addNewProduct, fetchProductByMSAID, fetchAllProductOnlyMSAID, fetchProductsByCategoryOnlyMSAID, fetchProductsByCategory, searchCategoryProducts };