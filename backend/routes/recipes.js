import { Router } from 'express';
import Recipe from '../models/Recipe.js';
import Rating from '../models/Rating.js';

const router = Router();

router.get('/', async (req, res) => {
  const { q, member_id } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: q, $options: 'i' };
  if (member_id) filter.added_by = member_id;
  const recipes = await Recipe.find(filter).sort({ createdAt: -1 });
  res.json(recipes);
});

router.post('/', async (req, res) => {
  const { title, description, ingredients, instructions, cuisine, image_url, source_url, added_by } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const recipe = await Recipe.create({ title, description, ingredients, instructions, cuisine, image_url, source_url, added_by });
  res.status(201).json(recipe);
});

router.get('/:id', async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate('added_by', 'name avatar_color');
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json(recipe);
});

router.put('/:id', async (req, res) => {
  const { title, description, ingredients, instructions, cuisine, image_url, source_url } = req.body;
  const recipe = await Recipe.findByIdAndUpdate(
    req.params.id,
    { title, description, ingredients, instructions, cuisine, image_url, source_url },
    { new: true, runValidators: true }
  );
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json(recipe);
});

router.delete('/:id', async (req, res) => {
  await Recipe.findByIdAndDelete(req.params.id);
  await Rating.deleteMany({ recipe_id: req.params.id });
  res.json({ ok: true });
});

router.post('/:id/rate', async (req, res) => {
  const { member_id, rating } = req.body;
  if (!member_id || ![-1, 1].includes(rating)) {
    return res.status(400).json({ error: 'member_id and rating (1 or -1) required' });
  }
  const doc = await Rating.findOneAndUpdate(
    { recipe_id: req.params.id, member_id },
    { rating },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json(doc);
});

export default router;
