import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import consultationRoutes from './routes/consultations';
import cbtRoutes from './routes/cbt';
import chatRoutes from './routes/chat';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/consultations', consultationRoutes);
app.use('/cbt', cbtRoutes);
app.use('/chat', chatRoutes);

const PORT = Number(process.env.PORT) || 3000;
// Debug: show critical env presence (not values)
console.log('Env check →', {
  OPENAI_API_KEY: !!process.env.OPENAI_API_KEY ? 'set' : 'missing',
  STREAM_API_KEY: !!process.env.STREAM_API_KEY ? 'set' : 'missing',
  STREAM_API_SECRET: !!process.env.STREAM_API_SECRET ? 'set' : 'missing',
});
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
