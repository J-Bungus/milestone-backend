const express = require("express");
const {
  loginUser,
  returnValidatedUser,
  updateUser,
  changePassword,
  registerUser,
  sendForgotPasswordEmail,
  verifyLogin,
  
} = require("../controllers/userController");
const { validateToken, validateAdminToken, validatePasswordResetToken } = require("../middleware/validateTokenHandler");

const router = express.Router();

router.post("/login", loginUser);
router.post("/login/verify", validateToken, verifyLogin);
router.post("/register", validateAdminToken, registerUser);
router.get("/validate", validateToken, returnValidatedUser);
router.get("/validate/admin", validateAdminToken, returnValidatedUser);
router.get("/validate/resetToken", validatePasswordResetToken, returnValidatedUser);
router.post("/update", validateToken, updateUser);
router.post("/password/change", validateToken, changePassword);
router.post("/password/forgot", sendForgotPasswordEmail);

module.exports = router;