import handleAsyncError from "../middleware/handleAsyncError.js";
import User from "../model/userModel.js";
import HandleError from "../utils/handleError.js";
import { sendToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

// register user
export const registerUser = handleAsyncError(async (req, res, next) => {
  const { name, email, password, avatar } = req.body;

  if (!name || !email || !password) {
    return next(new HandleError("Please provide name, email and password", 400));
  }

  if (!avatar || avatar.trim() === "") {
    return next(new HandleError("Avatar is required", 400));
  }

  let myCloud;
  try {
    myCloud = await cloudinary.uploader.upload(avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
  } catch (error) {
    return next(
      new HandleError(error.message || "Avatar upload failed", 500)
    );
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });

  sendToken(user, 201, res);
});


// Login
export const loginUser = handleAsyncError(async (req, res, next) => {
  console.log("line no 50")
  const { email, password } = req.body;
  

  if (!email || !password) {
    return next(
      new HandleError("Email or password can not be empty", 400)
    );
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select("+password");

  if (!user) {
    return next(new HandleError("Invalid Email or password", 401));
  }
  // password verify
  const isPasswordValid = await user.verifyPassword(password);

  if (!isPasswordValid) {
    return next(new HandleError("Invalid Email or password", 401));
  }

  // removng  sensitive fields dont want to send it in response
  user.password = undefined;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  sendToken(user, 200, res);
});


// // new login method
// export const loginUser = async (req, res) => {
//     try {
//         const { password, userName } = req.body;
//         if (!password || !userName) {
//             return res.status(400).json({ message: "Email and userName required" });
//         }
//         const user = await User.findOne({ userName });
//         if (!user) {
//             return res.status(400).json({ message: "User Not Found !!" });
//         };

//         const isMatched = await bcrypt.compare(password, user.password);

//         if (!isMatched) {
//             return res.status(400).json({ message: "Incorrect Password !!" });
//         }
//          sendToken(user, 200, res);

//          console.log("send tolken line no 104")

//         // const token = await genToken(user._id)

//         // res.cookie("token", token, {
//         //     httpOnly: true,
//         //     // secure: false,
//         //     secure: true,
//         //     // sameSite: "strict",
//         //     sameSite: "none",
//         //     maxAge: 10 * 365 * 24 * 60 * 60 * 1000,
//         // })

//         return res.status(200).json(user);
//     }
//     catch (err) {
//         return res.status(500).json({ message: `Signin Error ${err}` });
//     }
// }




//Logout
export const logout = handleAsyncError(async (req, res, next) => {
res.cookie("token", null, {
  expires: new Date(Date.now()),
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});
// i was facing cors issues that is why i added env var. for https safety
  res.status(200).json({
    success: true,
    message: "Successfully Logged out",
  });
});

//forgot Password
export const requestPasswordReset = handleAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new HandleError("User doesn't exist", 400));
  }
  let resetToken;
  try {
    resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    console.log(error);
    return next(
      new HandleError("Could not save reset token,please try agan later", 500),
    );
  }

  console.log("protocol", req.protocol);
  console.log("host", req.get("host"));
  // const resetPasswordURL = `${req.protocol}://${req.get("host")}/reset/${resetToken}`;
  const resetPasswordURL = `${process.env.FRONTEND_URL}/reset/${resetToken}`;

  console.log(resetPasswordURL);

  const message = `Use the following link to reset your password: ${resetPasswordURL}. \n\n This link will expire in 30 minutes.\n\n If you didn't request reset, please ignore this message.`;
  try {
    //send email
    await sendEmail({
      email: user.email,
      subject: "Please Reset Request",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email is sent to ${user.email} successfuly`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new HandleError("Email could not be sent, please try again later", 500),
    );
  }
});

//reset password
export const resetPassword = handleAsyncError(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(
      new HandleError(
        "Reset Password token is invalid or has been expired",
        400,
      ),
    );
  }
  const { password, confirmPassword } = req.body;
 if (!password || !confirmPassword || password !== confirmPassword) {
    return next(new HandleError("password doesn't match", 400));
  }
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendToken(user, 200, res);
});

//get user details
export const getUserDetails = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

//update password
export const updatePassword = handleAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user.id).select("+password");
  
  if (!user) return next(new HandleError("User not found", 404));

  const checkPasswordMatch = await user.verifyPassword(oldPassword);
  if (!checkPasswordMatch) {
    return next(new HandleError("Old password is incorrect", 400));
  }
  if (newPassword !== confirmPassword) {
    return next(new HandleError("Password does not match", 400));
  }
  user.password = newPassword;
  await user.save();
  sendToken(user, 200, res);
});

//updating user profile
export const updateProfile = handleAsyncError(async (req, res, next) => {
  const { name, email, avatar } = req.body;
  const updateDetails = {
    name,
    email,
  };
  if (avatar && avatar !== "") {
    const user = await User.findById(req.user.id);
    const imageId = user.avatar.public_id;
    await cloudinary.uploader.destroy(imageId);
    const myCloud = await cloudinary.uploader.upload(avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });
    updateDetails.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }
  const user = await User.findByIdAndUpdate(req.user.id, updateDetails, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
    user,
  });
});

//Admin -- Getting user information
export const getUserList = handleAsyncError(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

// /Admin - Getting single user information
export const getSingleUser = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new HandleError(`User doesn't exist with this id: ${req.params.id}`, 400),
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// /Admin - Changing user role
export const updateUserRole = handleAsyncError(async (req, res, next) => {
  const { role } = req.body;

  const newUserData = {
    role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(HandleError("User does not exist", 400));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

//admin - Delete User profile
export const deleteUser = handleAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new HandleError(`User doesn't exist`, 400));
  }
  // delete image from cloudinary
  const imageId = user.avatar.public_id;
  await cloudinary.uploader.destroy(imageId);

  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});
