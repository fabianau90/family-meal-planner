import { Router } from 'express';
import FamilyMember from '../models/FamilyMember.js';

const router = Router();

router.get('/', async (req, res) => {
  const members = await FamilyMember.find().sort('name');
  res.json(members);
});

router.post('/', async (req, res) => {
  const { name, avatar_color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const member = await FamilyMember.create({ name, avatar_color });
  res.status(201).json(member);
});

router.get('/:id', async (req, res) => {
  const member = await FamilyMember.findById(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

router.put('/:id', async (req, res) => {
  const { name, avatar_color, avatar_url, cuisines, dietary_restrictions, dislikes } = req.body;
  const member = await FamilyMember.findByIdAndUpdate(
    req.params.id,
    { name, avatar_color, avatar_url, cuisines, dietary_restrictions, dislikes },
    { new: true, runValidators: true }
  );
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

router.delete('/:id', async (req, res) => {
  await FamilyMember.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
