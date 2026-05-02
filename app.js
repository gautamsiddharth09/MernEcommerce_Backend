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
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({ path: "backend/config/config.env" });
}

const app = express();

// app.use(
//   cors({
//     origin: true,
//     credentials: true,
//   }),
// );

app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

// app.use(cors({
//   origin: "http://localhost:5173", // No function, just the string
//   credentials: true
// }));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(fileUpload());

// Routes
app.use("/api/v1", productRoutes);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

// Serve frontend in production
if (process.env.NODE_ENV === "PRODUCTION") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// Error Middleware (ALWAYS LAST)
app.use(errorHandleMiddleware);

export default app;
