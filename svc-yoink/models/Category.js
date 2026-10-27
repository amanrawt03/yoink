import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    imageUrl: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

categorySchema.index({ slug: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
