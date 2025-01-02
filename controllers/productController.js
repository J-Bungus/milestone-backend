const asyncHandler = require("express-async-handler");
const ProductModel = new (require ("../models/productModel"))();
const ProductCategoryModel = new (require ("../models/productCategoryModel"))();

const fetchAllProducts = asyncHandler(async (req, res) => {
  const { page, itemsPerPage } = req.query;

  let products = [];
  let count = 0;
  try {
    products = await ProductModel.getAllWithImages(page, itemsPerPage);
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

const fetchProductsByCategory = asyncHandler(async (req, res) => {
  const { category_id, page, itemsPerPage } = req.query;
  try {
    const products = await ProductModel.getProductByCategory(category_id, page, itemsPerPage);
    const count = await ProductModel.countProductByCategory(category_id);
    res.status(200).json({ products, totalProducts: count});
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while fetching products");
  }
})

module.exports = { fetchAllProducts, fetchProductsBySearchTerm, addNewProduct, fetchProductByMSAID, fetchAllProductOnlyMSAID, fetchProductsByCategoryOnlyMSAID, fetchProductsByCategory};