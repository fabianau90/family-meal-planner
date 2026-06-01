import mongoose from 'mongoose';
import { seedRecipes, seedFamily } from './seed.js';

let ready = null;

export async function connectDB() {
  if (!ready) {
    ready = (async () => {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
      }
      await seedRecipes();
      await seedFamily();
    })().catch(err => {
      ready = null; // Allow retry on next request
      throw err;
    });
  }
  await ready;
}
