import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import MealPlan from '../models/MealPlan.js';

const router = Router();

router.post('/generate', async (req, res) => {
  const { week_start } = req.body;
  if (!week_start) return res.status(400).json({ error: 'week_start required' });

  const meals = await MealPlan.find({ week_start, recipe_id: { $ne: null } })
    .populate('recipe_id', 'title ingredients');

  if (!meals.length) return res.status(400).json({ error: 'No meals planned for this week' });

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mealsList = meals.map(m =>
    `${days[m.day_index]} ${m.meal_type}: ${m.recipe_id?.title}\nIngredients: ${
      (m.recipe_id?.ingredients || []).join(', ') || 'not specified'
    }`
  ).join('\n\n');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Based on these planned meals, generate a consolidated grocery shopping list.
Combine duplicate ingredients, estimate quantities for a family of 4, and group by store section (Produce, Meat, Dairy, Pantry, Frozen, etc.).

Meals this week:
${mealsList}

Return a clean, organized shopping list grouped by category.`,
    }],
  });

  res.json({ shopping_list: response.content[0].text });
});

export default router;
