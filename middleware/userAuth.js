
import jwt from "jsonwebtoken";
import User from "../model/userModel.js";
import HandleError from "../utils/handleError.js";

export const verifyUserAuth = async (req, res, next) => {

let token;

// cookie check
if (req.cookies.token) {
  token = req.cookies?.token; 
}
//  fallback
else if (req.headers.authorization?.startsWith("Bearer")) {
  token = req.headers.authorization.split(" ")[1];
}

if (!token) {
  return next(new HandleError("Authentication token missing", 401));
}

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("Decoded data:", decodedData);

    const user = await User.findById(decodedData.id);
    console.log("User found:", user);

    if (!user) {
      console.log("User not found");
      return next(new HandleError("User not found", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Token verification error:", error);
    return next(new HandleError("Invalid or expired token", 401));
  }
};

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
