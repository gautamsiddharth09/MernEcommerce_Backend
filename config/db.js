import mongoose from "mongoose";

export const connectMongoDatabase = async () => {
  try {
    const data = await mongoose.connect(process.env.DB_URI);

    console.log(`MongoDB connected with server ${data.connection.host}`);
    return data; 
    
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err; // it will handle server.js 
  }
};