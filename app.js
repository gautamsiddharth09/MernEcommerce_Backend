import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import errorHandleMiddleware from "./middleware/error.js";
import user from "./routes/userRoutes.js";
import order from "./routes/orderRoutes.js";
import payment from "./routes/paymentRoutes.js";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";

// Load env (expects to be run from backend folder)
dotenv.config({ path: "config/config.env" });

const app = express();

// Use a single allowed origin (env or local dev default)
const FRONTEND_URL = process.env.FRONTEND_URL
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);

// Parsers and file upload
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    limits: { fileSize: 10 * 1024 * 1024 },
  }),
);

// Routes
app.use("/api/v1", productRoutes);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

// Health check
app.get("/api/health", (req, res) =>
  res.status(200).json({ success: true, message: "API is working" }),
);

// NOTE: Serving the frontend from this server is optional.
// If you deploy frontend separately (Vercel/Netlify), keep this removed.

// Error handler
app.use(errorHandleMiddleware);

export default app;
