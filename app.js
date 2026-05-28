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

// Fix __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env FIRST 
dotenv.config({ path: path.join(__dirname, "config", "config.env") });

const app = express();

//  CORS config 
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://mern-ecommerce-frontend-e82ca079z-gautamsiddharth09s-projects.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  next();
});

// Middlewares
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" })); 
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    limits: {
      fileSize: 10 * 1024 * 1024,
    },
  })
);

// in development debugging
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`Route hit: ${req.method} ${req.url}`);
    next();
  });
}
//  Routes
app.use("/api/v1", productRoutes);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

// health check route (debugging ke liye helpful)
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is working" });
});

// Serve frontend
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "../frontend/dist");

  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(frontendPath, "index.html"));
  });
}

// Error Middleware 
app.use(errorHandleMiddleware);

export default app;
