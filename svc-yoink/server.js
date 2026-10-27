import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Yoink API running');
});

// Start the server only after the database is connected
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});