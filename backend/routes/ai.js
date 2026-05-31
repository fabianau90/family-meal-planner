import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import FamilyMember from '../models/FamilyMember.js';
import Rating from '../models/Rating.js';

const router = Router();

router.post('/suggest', async (req, res) => {
  const { member_ids, message, history = [] } = req.body;
  if (!member_ids?.length) return res.status(400).json({ error: 'member_ids required' });

  const members = await FamilyMember.find({ _id: { $in: member_ids } });
  const topRatings = await Rating.find({ member_id: { $in: member_ids }, rating: 1 })
    .populate('recipe_id', 'title cuisine')
    .limit(10);

  const memberSummary = members.map(m =>
    `- ${m.name}: likes ${(m.cuisines || []).join(', ') || 'anything'}, ` +
    `dietary: ${(m.dietary_restrictions || []).join(', ') || 'none'}, ` +
    `dislikes: ${(m.dislikes || []).join(', ') || 'none'}`
  ).join('\n');

  const ratedSummary = topRatings.length
    ? `\nPreviously loved recipes:\n${topRatings.map(r => `- ${r.recipe_id?.title}`).join('\n')}`
    : '';

  const systemPrompt = `You are a friendly family meal planning assistant.
Suggest meals that work for everyone. Be specific with recipe names and brief descriptions.
Keep suggestions practical and delicious.

Family members eating today:
${memberSummary}${ratedSummary}

Format suggestions as a numbered list with the meal name, cuisine type, and a one-sentence description.`;

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
