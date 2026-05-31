import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './services/db.js';
import familyRoutes from './routes/family.js';
import recipeRoutes from './routes/recipes.js';
import mealPlanRoutes from './routes/mealPlan.js';
import aiRoutes from './routes/ai.js';
import shoppingRoutes from './routes/shopping.js';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      'http://localhost:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean);
    // Allow requests with no origin (Vercel serverless, curl, etc.)
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/family', familyRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plan', mealPlanRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shopping', shoppingRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

// Local dev: listen directly. Vercel: export the app.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  });
} else {
  connectDB().catch(console.error);
}

export default app;
