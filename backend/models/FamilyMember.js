import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar_color: { type: String, default: '#6366f1' },
  cuisines: [String],
  dietary_restrictions: [String],
  dislikes: [String],
}, { timestamps: true });

export default mongoose.model('FamilyMember', schema);
