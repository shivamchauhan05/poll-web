import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';

// Import routes
import authRoutes from './routes/authRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Import middleware and strategies
import './middleware/authMiddleware.js';
import './auth/googleStrategy.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors({ 
  origin: process.env.FRONTEND_URL, 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

// Routes
app.use('/auth', authRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chauhanshivam8836:pYAvXBlIILkWmjsF@cluster0.ngqxq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/shivam/polling_oauth';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});