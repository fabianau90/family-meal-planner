import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import Recipe from '../models/Recipe.js';
import { seedRecipes } from '../services/seed.js';
import Rating from '../models/Rating.js';

const router = Router();

// GET recipes — local DB + optional Tavily web search
router.get('/', async (req, res) => {
  const { q, member_id, web } = req.query;
  if (!q && !member_id) await seedRecipes(); // Ensure seeded on plain fetch
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

// POST fetch a recipe from a URL and extract structured data using Claude
router.post('/fetch-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'url required' });

  let html = '';
  try {
    const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    html = await response.text();
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
               .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               .replace(/<[^>]+>/g, ' ')
               .replace(/\s+/g, ' ')
               .slice(0, 15000);
  } catch {
    return res.status(400).json({ error: 'Could not fetch that URL' });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const aiResponse = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are extracting a recipe from webpage text. Return ONLY a JSON object with no markdown.

Rules:
- "title" must be the RECIPE NAME only (e.g. "Banana Pancakes"), never an article headline or blog post title
- "ingredients" must be a complete array — include every ingredient listed, do not truncate or use "..."
- "instructions" must be the full step-by-step method as a single string
- "cuisine" is the type of cuisine (e.g. "Singaporean", "Western", "Japanese") — leave blank if unknown
- "description" is one short sentence describing the dish

If no recipe exists on this page, return: {"error":"No recipe found"}

Webpage text:
${html}

JSON output:`,
    }],
  });

  try {
    const text = aiResponse.content[0].text.trim().replace(/^```json?\s*/i, '').replace(/```$/, '');
    const parsed = JSON.parse(text);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    res.json({ ...parsed, source_url: url });
  } catch {
    res.status(500).json({ error: 'Could not parse recipe from page' });
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
