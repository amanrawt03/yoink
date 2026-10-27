import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Yoink API running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
