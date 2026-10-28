import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const clientOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());
app.use(cors({ origin: clientOrigins, credentials: true }));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (_req, res) => {
  res.send('Yoink API running');
});

app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed')
    return res.status(400).json({ message: 'Invalid JSON request body.' });
  if (error.message === 'JWT_SECRET is not configured.')
    return res.status(500).json({ message: 'Authentication is not configured on this server.' });
  console.error(error);
  return res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// Start the server only after the database is connected
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
