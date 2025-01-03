const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = new (require("../models/userModel"))();
const IPAddressModel = new (require("../models/ipAddressModel"))();

const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400);
    throw new Error("Username and password are required");
  }

  let user;
  try {
    user = await UserModel.getOneByUsername(username);
  } catch (error) {
    console.error(error);
  }

  if (!user) {
    res.status(404);
    throw new Error("Username was not found");
  }

  const validPass = await bcrypt.compare(password, user.password);

  if (validPass || user.password === password) {
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "3d" });

    if (user.is_admin) {
      res.status(200).json({ accessToken, user, requireVerification: false });
      return;
    }

    const ips = await IPAddressModel.getIPsByUserId(user.id);
    let requireVerification = false;
    const clientIP = req.headers["x-forwarded-for"] || req.clientIp || req.ip?.split(":").at(-1) || req._remoteAddress;
    console.log(ips);
    ips.map(ip => {
      console.log(ip);
      console.log(ip.ip);
    });

    ips.map(ip => {
      console.log(ip);

      return true;
    });
    if (ips.length > 0 && ips.every((ip) => { console.log(ip); ip.ip !== String(clientIP)})) {
      requireVerification = true;
      try {
        const verification = await twilio.verifications.create({
          to: "+1" + user.phone, 
          channel: 'sms'
        });
        console.log(verification.sid);
      } catch (error) {
        console.error(error);
        res.status(500);
        throw new Error("An error occurred while sending verification code");
      }

    } else if (ip.length === 0) {
      const newIp = await IPAddressModel.createIP(clientIP, user);
    }

    res.status(200).json({ accessToken, user, requireVerification, loginIP: clientIP });
  } else {
    res.status(401);
    throw new Error("Username or password is not valid");
  }
});

const returnValidatedUser = asyncHandler(async (req, res) => {
  res.status(200).json({ userInfo: req.user });
});

const updateUser = asyncHandler(async (req, res) => {
  const { userInfo } = req.body;

  const existingUser = await UserModel.getOneByUsername(userInfo.username);
  if (existingUser && existingUser.id !== userInfo.id) {
    res.status(500);
    throw new Error("Sorry, this username is already taken.");
  }

  try {
    delete userInfo.iat;
    delete userInfo.exp;
    delete userInfo.password;

    const updatedUser = UserModel.createOrUpdateUser(userInfo);

    res.json({ userInfo: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while creating/updating user");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { userInfo, password } = req.body;
  try {
    const hashedPass = await bcrypt.hash(password, 10);

    userInfo.id = req.user.id;
    userInfo.password_reset_token = null;

    let updatedUser;
    if (!userInfo.iat && !userInfo.exp) {
      updatedUser = await UserModel.createOrUpdateUser({...userInfo});
    }

    updatedUser = await UserModel.updatePassword({...userInfo}, hashedPass);
    res.status(200).json({ userInfo: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while changing password");
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { userInfo } = req.body;

  let existingUser = await UserModel.getOneByUsername(userInfo.username);

  if (existingUser) {
    res.status(500);
    throw new Error("This username is already taken!");
  }

  try {
    const hashedPass = await bcrypt.hash(userInfo.password, 10);
    let updatedUser = await UserModel.createOrUpdateUser(userInfo);
    updatedUser = await UserModel.updatePassword(updatedUser, hashedPass);

    const response = await sgMail.send({
      to: updatedUser.email,
      from: process.env.SENDGRID_TEST_SENDER,
      subject: `Milestone Autosupplies Account Registration`,
      html: `
        <div> Hi ${updatedUser.name}, </div> <br/>
        <div> Thank you for choosing Milestone Autosupplies!<div>
        <div> Here are your log in credentials: </div>
        <div> <strong>Username:</strong> ${updatedUser.username} </div>
        <div> <strong>Password:</strong> ${userInfo.password} </div>
        <div> Please do not share your credentials with anyone! </div>
        <div> You may log into your account and browse our products.</div>
        <div> If you have any questions, feel free to reply to this email with them or email milestoneautosuppliesinc@hotmail.com.</div>
      `
    });

    console.log(response[0].statusCode);

    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while registering user");
  }
});

const sendForgotPasswordEmail = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const user = await UserModel.getOneByUsername(username);
  const resetToken = jwt.sign({ id: user.id , username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10m' });

  if (!user) {
    res.status(404);
    throw new Error("The username does not match any of our records");
  }

  try {
    const response = await sgMail.send({
      to: user.email,
      from: process.env.SENDGRID_TEST_SENDER,
      subject: `Milestone Autosupplies Password Reset`,
      html: `
        <div>Here is the link to reset your password:
          <a href="${process.env.WEBSITE_URL}/reset-password?token=${resetToken}"> Reset Password</a>
        </div>
      `
    });

    delete user.created_at;
    await UserModel.createOrUpdateUser({...user, password_reset_token: resetToken });
    res.status(200).end();
  } catch (error) {
    console.error(error);
    res.status(500);
    throw new Error("An error occurred while sending email");
  }
});

const verifyLogin = asyncHandler(async (req, res) => {
  const { code, clientIP } = req.body;
  const user = req.user;
  try {
    const verification_check = await twilio.verificationChecks.create({
      to: "+1" + user.phone, 
      code: code
    });
    console.log(verification_check.status);

    if (verification_check.status === "approved") {
      const newIp = await IPAddressModel.createIP(clientIP, user);
    }

    res.status(200).json({ userInfo: user, status: verification_check.status });
  } catch (error) {
    console.error(error);
    res.status(error.status);
    if (String(error.message).includes("requested resource") && String(error.message).includes("was not found")) {
      throw new Error("Your verification code has expired. Login again to receive a new code");
    } else {
      throw new Error("Your code could not be validated. Please try again in a few minutes.");
    }
  }
});

module.exports = { loginUser, returnValidatedUser, updateUser, changePassword, registerUser, sendForgotPasswordEmail, verifyLogin };