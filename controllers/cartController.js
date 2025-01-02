const asyncHandler = require("express-async-handler");
const CartsModel = new (require ("../models/cartsModel"))();

const updateItem = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const { item } = req.body;
  console.log(req.body);
  console.log(item);

  let updatedCart;
  try {
    updatedCart = await CartsModel.createOrUpdateCart(user_id, item); 
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("Error updating cart item");
  }

  res.status(200).json({ updatedCart });
});

const removeItem = asyncHandler(async (req, res) => {
  console.log(req.params);
  const user_id  = req.user.id;
  const product_id = parseInt(req.params.product_id);
  console.log(product_id);

  let itemCount;
  try {
    itemCount = await CartsModel.deleteCartItem(user_id, product_id);
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("Error removing cart item");
  }

  res.status(200).json({ itemCount });
});

const clearCart = asyncHandler(async (req, res) => {
  const user_id = req.user.id;

  try {
    await CartsModel.deleteCart(user_id);
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("Error clearing cart");
  }

  res.status(204).end();
});

const getCart = asyncHandler(async (req, res) => {
  const user_id  = req.user.id;

  let cart;
  try {
    cart = await CartsModel.getCart(user_id);
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("Error while fetching cart");
  }

  res.status(200).json({ cart });
});

module.exports = { updateItem, removeItem, clearCart, getCart };