import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar_color: { type: String, default: '#6366f1' },
  avatar_url: { type: String, default: null },
  cuisines: [String],
  dietary_restrictions: [String],
  dislikes: [String],
  likes: [String],
}, { timestamps: true });

export default mongoose.model('FamilyMember', schema);
