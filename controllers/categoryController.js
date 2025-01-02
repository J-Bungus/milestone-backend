const asyncHandler = require("express-async-handler");
const CategoryModel = new (require("../models/categoryModel"))();

const fetchCategoriesByParent = asyncHandler(async (req, res) => {
  const parent_id = req.params.parent_id || null; 
  try {
    const categories = await CategoryModel.getCategoriesByLevel(parent_id);
    res.status(200).json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while fetching categories");
  }  
});

const addNewCategory = asyncHandler(async (req, res) => {
  const { category, parent_id } = req.body;

  try {
    const newID = await CategoryModel.addCategory(category, parent_id || null);
    res.status(200).json({ category_id: newID.id})
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occured while adding new category");
  }
});

const updateCategory = asyncHandler(async (req, res) => {
  const { category } = req.body;
  console.log(category);
  try {
    const updatedID = await CategoryModel.editCategory(category);
    res.status(200).json({ category_id: updatedID.id });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while editing category");
  }
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { category_id } = req.params;

  try {
    await CategoryModel.deleteCategory(category_id);
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while deleting category");
  }
});

const fetchAllCategories = asyncHandler(async (req, res) => {
  const buildTree = (categories, parent_id = null) => {
    return categories
      .filter(category => category.parent_id === parent_id)
      .map(category => ({
        ...category,
        children: buildTree(categories, category.id)
      }));
  }
  
  try {
    const categories = await CategoryModel.getAllCategories();
    const categoryTree = buildTree(categories, null);
    
    res.status(200).json({ categoryTree, categories });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while getting category data");
  }
});

const fetchLeafCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await CategoryModel.getLeaves();
    res.status(200).json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while getting leaf categories");
  }
});

module.exports = { fetchCategoriesByParent, addNewCategory, updateCategory, deleteCategory, fetchAllCategories, fetchLeafCategories};