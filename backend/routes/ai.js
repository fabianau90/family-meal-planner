import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import FamilyMember from '../models/FamilyMember.js';
import Rating from '../models/Rating.js';
import Recipe from '../models/Recipe.js';

const router = Router();

router.post('/suggest', async (req, res) => {
  const { member_ids, message, history = [] } = req.body;
  if (!member_ids?.length) return res.status(400).json({ error: 'member_ids required' });

  const [members, savedRecipes] = await Promise.all([
    FamilyMember.find({ _id: { $in: member_ids } }),
    Recipe.find().select('title cuisine description').sort({ createdAt: -1 }).limit(50),
  ]);

  const [topRatings, allRatings] = await Promise.all([
    Rating.find({ member_id: { $in: member_ids }, rating: 1 })
      .populate('recipe_id', 'title cuisine ingredients')
      .limit(15),
    Rating.find({ member_id: { $in: member_ids }, rating: -1 })
      .populate('recipe_id', 'title')
      .limit(10),
  ]);

  const member = members[0];
  const likes = (member?.likes || []).join(', ') || 'not yet specified';
  const dislikes = (member?.dislikes || []).join(', ') || 'none';
  const cuisines = (member?.cuisines || []).join(', ') || 'not yet specified';
  const dietary = (member?.dietary_restrictions || []).join(', ') || 'none';

  const lovedRecipes = topRatings.length
    ? topRatings.map(r => `- ${r.recipe_id?.title} (${r.recipe_id?.cuisine || 'unknown cuisine'})`).join('\n')
    : 'None rated yet';

  const dislikedRecipes = allRatings.length
    ? allRatings.map(r => `- ${r.recipe_id?.title}`).join('\n')
    : 'None';

  const savedRecipeList = savedRecipes.length
    ? savedRecipes.map(r => `- ${r.title}${r.cuisine ? ` (${r.cuisine})` : ''}`).join('\n')
    : 'No recipes saved yet';

  const systemPrompt = `You are a personal meal planning assistant for Yvette, a 6-year-old Singaporean girl living in Singapore.
You are chatting with her parent (dad) to help plan her meals.

Your knowledge about Yvette:
- Age: 6 years old, Singaporean, based in Singapore
- Favourite cuisines: ${cuisines}
- Foods she specifically likes: ${likes}
- Foods she dislikes: ${dislikes}
- Dietary restrictions: ${dietary}
- Recipes she has loved (thumbs up):
${lovedRecipes}
- Recipes she has disliked (thumbs down):
${dislikedRecipes}

Recipes saved in the family recipe book (prefer suggesting these first when relevant):
${savedRecipeList}

How to behave:
1. ALWAYS prioritise suggestions from the saved recipe book above — suggest those by name when they fit
2. When suggesting a saved recipe, mention it by its exact saved name so the parent can find it easily
3. Mix saved recipes with fresh ideas — aim for at least half the suggestions to come from the recipe book
4. Ground suggestions in Singapore food culture — hawker dishes, local favourites, kopitiam staples
5. Cross-reference the full conversation history for context
6. Avoid her dislikes in most suggestions; occasionally (1 in 4) include a disliked ingredient hidden in a mild way to gently expand her palate — flag it clearly for the parent
7. Keep meals practical: suitable for a 6-year-old, not too spicy

Format: numbered list — meal name (mark saved recipes with "📖"), cuisine type, one sentence on why Yvette will enjoy it.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages = [
    ...history,
    { role: 'user', content: message || 'Suggest 3 meals that everyone will enjoy.' },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  res.json({
    reply: response.content[0].text,
    history: [...messages, { role: 'assistant', content: response.content[0].text }],
  });
});

router.post('/search-recipes', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  const tavilyRes = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query: `recipe: ${query}`,
      search_depth: 'basic',
      max_results: 5,
      include_answer: false,
    }),
  });

  if (!tavilyRes.ok) return res.status(500).json({ error: 'Search failed' });
  const data = await tavilyRes.json();

  res.json({
    results: data.results.map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 200),
    })),
  });
});

export default router;
