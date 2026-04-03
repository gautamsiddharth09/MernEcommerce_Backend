import dotenv from "dotenv";


//handle uncaught exception errors
process.on('uncaughtException', (err)=>{
  console.log(`Error : ${err.message}`);
  console.log(`server is shutting down due to uncaught exception error`);
  process.exit(1);
})


import app from "./app.js";

import { connectMongoDatabase } from "./config/db.js";

if(process.env.NODE_ENV !== "PRODUCTION"){
  dotenv.config({path:'./config/config.env'})
}

import {v2 as cloudinary} from 'cloudinary'; 
import Razorpay from "razorpay";

// Connect DB
connectMongoDatabase();
// cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});



export default cloudinary;

const port = process.env.PORT || 3000;
export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});



// instance.orders.all().then(console.log).catch(console.error);

const server = app.listen( port, ()=>{
  console.log(`server is running on port ${ port}`)
})

// Unhandled Promise Rejection
process.on('unhandledRejection',(err)=>{
  console.log(`Error: ${err.message}`)
  console.log(`server is shutting down due to unhanlded Promise rejection`);
  server.close(()=>{
    process.exit(1)
  })
})