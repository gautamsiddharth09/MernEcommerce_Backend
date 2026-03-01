import handleAsyncError from "./handleAsyncError.js";
import jwt from "jsonwebtoken";
import User from "../model/userModel.js";
import HandleError from "../utils/handleError.js";

export const verifyUserAuth = handleAsyncError(async (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      new HandleError(
        "Authentication token missing or invalid format",
        401
      )
    );
  }

  // extract token after "Bearer "
  const token = authHeader.split(" ")[1];

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await User.findById(decodedData.id);

    if (!user) {
      return next(new HandleError("User not found", 401));
    }

    req.user = user;
    next();

  } catch (error) {
    return next(new HandleError("Invalid or expired token", 401));
  }
});

export const roleBasedAccess = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new HandleError(
          `Role - ${req.user.role} is not allowed to access the resource`,
          403,
        ),
      );
    }
    next();
  };
};
