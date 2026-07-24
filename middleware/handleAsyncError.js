const handleAsyncError = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error("ERROR:", err);

      if (typeof next === "function") {
        return next(err);
      }

      res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
      });
    }
  };
};

export default handleAsyncError;