import express from 'express';
import cors from 'cors';
import levelRoutes from './routes/levels.js';
import progressRoutes from './routes/progress.js';
import syncRoutes from './routes/sync.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/levels', levelRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/sync', syncRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
