import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import consultationRoutes from './routes/consultations';
import chatRoutes from './routes/chat';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/consultations', consultationRoutes);
app.use('/chat', chatRoutes);

const { PORT } = process.env;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
