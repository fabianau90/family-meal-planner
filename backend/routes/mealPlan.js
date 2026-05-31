import { Router } from 'express';
import MealPlan from '../models/MealPlan.js';

const router = Router();

router.get('/', async (req, res) => {
  const { week_start } = req.query;
  if (!week_start) return res.status(400).json({ error: 'week_start required' });
  const meals = await MealPlan.find({ week_start })
    .populate('recipe_id', 'id title description cuisine image_url')
    .sort('day_index');
  res.json(meals);
});

router.post('/', async (req, res) => {
  const { week_start, day_index, meal_type, recipe_id } = req.body;
  if (week_start == null || day_index == null || !meal_type) {
    return res.status(400).json({ error: 'week_start, day_index, and meal_type required' });
  }
  const meal = await MealPlan.findOneAndUpdate(
    { week_start, day_index, meal_type },
    { recipe_id: recipe_id || null },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('recipe_id', 'id title description cuisine image_url');
  res.json(meal);
});

router.delete('/:id', async (req, res) => {
  await MealPlan.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
