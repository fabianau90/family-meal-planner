import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  ingredients: [String],
  instructions: String,
  cuisine: String,
  image_url: String,
  source_url: String,
  added_by: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember' },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

export default mongoose.model('Recipe', schema);
