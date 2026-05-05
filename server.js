import dotenv from "dotenv";

//  i loaded env first
dotenv.config({ path: './config/config.env' });

// handle uncaught exception
process.on('uncaughtException', (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

import app from "./app.js";
import { connectMongoDatabase } from "./config/db.js";
import { v2 as cloudinary } from 'cloudinary'; 
import Razorpay from "razorpay";

// cloudinary setup 
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export { cloudinary };

const port = process.env.PORT || 3000;

// Razorpay
export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// connect DB then start server
connectMongoDatabase().then(() => {
  const server = app.listen(port, () => {
    console.log(`server is running on port ${port}`);
    
  });

  // Unhandled Promise Rejection
  process.on('unhandledRejection', (err) => {
    console.error(`Error: ${err.message}`);
    console.log(`server is shutting down due to unhandled Promise rejection`);

    server.close(() => {
      process.exit(1);
    });
  });
});