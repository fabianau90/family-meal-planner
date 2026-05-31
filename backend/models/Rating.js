import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', required: true },
  rating: { type: Number, enum: [-1, 1], required: true },
}, { timestamps: true });

schema.index({ recipe_id: 1, member_id: 1 }, { unique: true });

export default mongoose.model('Rating', schema);
