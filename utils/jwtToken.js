export const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();

  const options = {
    expires: new Date(
      Date.now() +
        Number(process.env.EXPIRE_COOKIE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "PRODUCTION",
    sameSite: process.env.NODE_ENV === "PRODUCTION" ? "none" : "lax",
  };

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, user });
};

// in local mode-- secure should be "false"
// in production mode -- secure should be "true"