export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
  const isProduction = process.env.NODE_ENV === "production";

  const options = {
    expires: new Date(
      Date.now() + Number(process.env.EXPIRE_COOKIE) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, user,token });
};

// For local development, this keeps the cookie compatible with cross-origin
// requests from the frontend. In production, secure stays enabled.
