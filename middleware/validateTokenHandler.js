const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const UserModel = new (require("../models/userModel"))();

const validateToken = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    res.status(401);
    throw new Error("Token is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token");
  }

});

const validateAdminToken = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    res.status(401);
    throw new Error("Token is required");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded.is_admin) {
      throw new Error("Not an admin user");
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token");
  }
});

const validatePasswordResetToken = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    res.status(401);
    throw new Error("Token is required!");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await UserModel.getOneByUsername(decoded.username);
    if (token !== user.password_reset_token) {
      res.status(401);
      throw new Error("Invalid or expired token");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired token");
  }
});

module.exports = { validateToken, validateAdminToken, validatePasswordResetToken};
