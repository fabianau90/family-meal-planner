import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  week_start: { type: String, required: true }, // 'YYYY-MM-DD'
  day_index: { type: Number, required: true, min: 0, max: 6 },
  meal_type: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner'] },
  recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', default: null },
}, { timestamps: true });

schema.index({ week_start: 1, day_index: 1, meal_type: 1 }, { unique: true });

export default mongoose.model('MealPlan', schema);
