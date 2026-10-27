import mongoose from 'mongoose';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    await Promise.all([
      User.init(),
      Category.init(),
      Product.init(),
      Cart.init(),
      Order.init(),
      Review.init(),
    ]);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
