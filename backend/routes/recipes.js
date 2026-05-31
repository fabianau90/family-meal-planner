import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import Recipe from '../models/Recipe.js';
import Rating from '../models/Rating.js';

const router = Router();

// GET recipes — local DB + optional Tavily web search
router.get('/', async (req, res) => {
  const { q, member_id, web } = req.query;
  const filter = {};
  if (q) filter.title = { $regex: q, $options: 'i' };
  if (member_id) filter.added_by = member_id;
  const local = await Recipe.find(filter).sort({ createdAt: -1 });

  // If web search requested and Tavily key exists, fetch web results too
  let webResults = [];
  if (web === '1' && q && process.env.TAVILY_API_KEY) {
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${q} recipe Singapore kid-friendly`,
          search_depth: 'basic',
          max_results: 5,
        }),
      });
      if (tavilyRes.ok) {
        const data = await tavilyRes.json();
        webResults = data.results.map(r => ({
          _web: true,
          title: r.title,
          description: r.content?.slice(0, 150),
          source_url: r.url,
        }));
      }
    } catch (_) {}
  }

  res.json({ local, webResults });
});

router.post('/', async (req, res) => {
  const { title, description, ingredients, instructions, cuisine, image_url, source_url, added_by } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const recipe = await Recipe.create({ title, description, ingredients, instructions, cuisine, image_url, source_url, added_by });
  res.status(201).json(recipe);
});

// POST scan a photo and extract recipe using Claude vision
router.post('/scan', async (req, res) => {
  const { image_base64, media_type = 'image/jpeg' } = req.body;
  if (!image_base64) return res.status(400).json({ error: 'image_base64 required' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type, data: image_base64.replace(/^data:image\/\w+;base64,/, '') },
        },
        {
          type: 'text',
          text: `Look at this image and extract the recipe information. Return a JSON object with these fields:
{
  "title": "recipe name",
  "description": "one sentence description",
  "cuisine": "cuisine type",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": "step by step cooking instructions"
}
If this is not a recipe or food image, return { "error": "Not a recipe image" }.
Return only valid JSON, no markdown.`,
        },
      ],
    }],
  });

  try {
    const parsed = JSON.parse(response.content[0].text);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    res.json(parsed);
  } catch {
    res.status(500).json({ error: 'Could not parse recipe from image' });
  }
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
